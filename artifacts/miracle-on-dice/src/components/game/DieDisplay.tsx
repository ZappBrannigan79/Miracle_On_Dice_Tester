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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}

export const DieDisplay: React.FC<DieDisplayProps> = (props) => {
  const { size = 'md', className, onClick } = props;

  // Extract die data from either props.die, props.face, or props directly
  const dieObj = props.die || props.face || props;

  // Look across all possible property names for the face value
  let rawValue = '';

  if (typeof dieObj === 'string') {
    rawValue = dieObj;
  } else if (dieObj && typeof dieObj === 'object') {
    // If face/result is a nested object (e.g. { type: 'shoot', pips: 2 }) or string
    const faceVal = dieObj.face || dieObj.currentFace || dieObj.result || dieObj.rolledFace || dieObj.value || dieObj.type;
    
    if (typeof faceVal === 'string') {
      rawValue = faceVal;
    } else if (faceVal && typeof faceVal === 'object') {
      rawValue = faceVal.type || faceVal.symbol || faceVal.name || faceVal.face || JSON.stringify(faceVal);
    } else {
      rawValue = JSON.stringify(dieObj);
    }
  }

  const str = String(rawValue).toLowerCase().trim();

  // Map to face filenames in public/assets/dice/
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
