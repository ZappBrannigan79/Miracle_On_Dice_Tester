import React from 'react';
import { cn } from '@/lib/utils';

// Helper to handle Vite / GitHub Pages subpaths cleanly
const getAssetUrl = (path: string) => {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

interface DieDisplayProps {
  die?: any;
  face?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}

export const DieDisplay: React.FC<DieDisplayProps> = (props) => {
  const { size = 'lg', className, onClick } = props;

  // Extract die object from props
  const dieObj = props.die || props.face || props;

  let rawValue = '';
  let pips: number | string | null = null;

  if (typeof dieObj === 'string') {
    rawValue = dieObj;
  } else if (dieObj && typeof dieObj === 'object') {
    // Extract face name
    const faceVal = dieObj.face || dieObj.currentFace || dieObj.result || dieObj.rolledFace || dieObj.value || dieObj.type;
    
    if (typeof faceVal === 'string') {
      rawValue = faceVal;
    } else if (faceVal && typeof faceVal === 'object') {
      rawValue = faceVal.type || faceVal.symbol || faceVal.name || faceVal.face || '';
      pips = faceVal.pips ?? faceVal.amount ?? faceVal.value ?? null;
    }

    // Check direct pip properties if not found inside nested face
    if (pips === null) {
      pips = dieObj.pips ?? dieObj.pipCount ?? dieObj.amount ?? dieObj.value ?? null;
    }
  }

  const str = String(rawValue).toLowerCase().trim();

  // Map to face filenames
  let faceKey = 'blank';
  if (str.includes('shoot') || str.includes('s')) {
    faceKey = 'shoot';
  } else if (str.includes('block') || str.includes('b')) {
    faceKey = 'block';
  } else if (str.includes('energy') || str.includes('e')) {
    faceKey = 'energy';
  } else if (str.includes('wild') || str.includes('w')) {
    faceKey = 'wild';
  } else if (str.includes('shutout') || str.includes('so')) {
    faceKey = 'shutout';
  }

  const imagePath = getAssetUrl(`/assets/dice/face_${faceKey}.png`);

  // Restored larger sizing options
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-xl bg-slate-950 border-2 border-slate-700 shadow-xl overflow-hidden shrink-0 cursor-pointer select-none transition-all hover:border-amber-400',
        sizeClasses[size],
        className
      )}
    >
      {/* Die Face Image */}
      <img
        src={imagePath}
        alt={`${faceKey} die face`}
        className="w-full h-full object-contain p-1.5 pointer-events-none"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* Pip Overlay Badge (if pips exist and are > 0) */}
      {pips !== null && pips !== undefined && pips !== '' && (
        <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 font-extrabold font-mono rounded-md px-1.5 py-0.5 text-xs shadow-md border border-amber-300 leading-none z-10">
          {pips}
        </div>
      )}
    </div>
  );
};
