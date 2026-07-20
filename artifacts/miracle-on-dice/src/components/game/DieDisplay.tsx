import React from 'react';
import { cn } from '@/lib/utils';

// Map face types/names directly to the filenames in public/assets/dice/
const DIE_FACE_IMAGES: Record<string, string> = {
  shoot: '/assets/dice/face_shoot.png',
  block: '/assets/dice/face_block.png',
  energy: '/assets/dice/face_energy.png',
  wild: '/assets/dice/face_wild.png',
  shutout: '/assets/dice/face_shutout.png',
  blank: '/assets/dice/face_blank.png',
};

// Helper to append GitHub Pages base path (/Miracle_On_Dice_Tester/)
const getAssetUrl = (path: string) => {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

interface DieDisplayProps {
  face: 'shoot' | 'block' | 'energy' | 'wild' | 'shutout' | 'blank' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DieDisplay: React.FC<DieDisplayProps> = ({
  face,
  size = 'md',
  className,
}) => {
  const key = face ? face.toLowerCase() : 'blank';
  const rawImagePath = DIE_FACE_IMAGES[key] || DIE_FACE_IMAGES.blank;
  const imageUrl = getAssetUrl(rawImagePath);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-lg bg-slate-950 border border-slate-700 shadow-md overflow-hidden shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <img
        src={imageUrl}
        alt={`${face} die face`}
        className="w-full h-full object-contain p-1 pointer-events-none select-none"
        onError={(e) => {
          // If face fails to load, keep container intact with standard text fallback
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};
