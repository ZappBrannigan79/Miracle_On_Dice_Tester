import React from 'react';
import { RolledDie } from '@/game/types';
import { cn } from '@/lib/utils';

export interface DieDisplayProps {
  die?: RolledDie | any;
  roll?: RolledDie | any;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animateRoll?: boolean;
  showCategoryBorder?: boolean;
  showLabel?: boolean;
  className?: string;
}

// Category border styles based on player/die role
const getCategoryBorder = (category?: string, isGoalie?: boolean) => {
  if (isGoalie || category === 'goalie') return 'border-slate-400 shadow-slate-400/30';
  switch (category) {
    case 'forward':
      return 'border-blue-500 shadow-blue-500/30';
    case 'defenseman':
      return 'border-red-500 shadow-red-500/30';
    case 'rookie':
      return 'border-slate-100 shadow-white/30';
    default:
      return 'border-amber-400 shadow-amber-400/30';
  }
};

// Formats position tags (e.g., F1, D1, Goalie)
const getDieLabel = (d: any) => {
  if (d?.sourceLabel) return d.sourceLabel;
  if (d?.positionLabel) return d.positionLabel;
  if (d?.isGoalie || d?.category === 'goalie') return 'Goalie';
  if (d?.category === 'forward') return 'Forward';
  if (d?.category === 'defenseman') return 'Defense';
  if (d?.category === 'rookie') return 'Rookie';
  return '';
};

export const DieDisplay: React.FC<DieDisplayProps> = ({
  die,
  roll,
  onClick,
  selectable = false,
  selected = false,
  size = 'md',
  showCategoryBorder = true,
  showLabel = true,
  className,
}) => {
  // Support either 'die' or 'roll' prop
  const dieData = die || roll;
  if (!dieData) return null;

  const face = dieData.face || dieData;
  const value = face.value ?? dieData.value ?? 0;
  const type = face.type || dieData.type || '';
  const category = dieData.category || dieData.playerCategory;
  const isGoalie = dieData.isGoalie || category === 'goalie';

  const borderColor = showCategoryBorder
    ? getCategoryBorder(category, isGoalie)
    : 'border-amber-400';

  const positionLabel = getDieLabel(dieData);

  // Sizing styles
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg text-xs',
    md: 'w-16 h-16 rounded-xl text-base',
    lg: 'w-20 h-20 rounded-2xl text-lg',
  }[size];

  return (
    <div
      className={cn('flex flex-col items-center gap-1', selectable && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative border-4 bg-slate-900 flex items-center justify-center transition-all duration-200 shadow-lg select-none',
          sizeClasses,
          borderColor,
          selected && 'ring-4 ring-yellow-400 scale-105',
          selectable && 'hover:scale-105'
        )}
      >
        {/* Face Image or Type Fallback */}
        {face.image || face.icon || dieData.faceImage ? (
          <img
            src={face.image || face.icon || dieData.faceImage}
            alt={type}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <span className="font-display font-bold uppercase text-white tracking-wider">
            {type}
          </span>
        )}

        {/* Pip Badge (Hides 0 pips) */}
        {value > 0 && (
          <div
            className={cn(
              'absolute bg-amber-500 text-slate-950 font-bold rounded-full flex items-center justify-center shadow',
              size === 'sm' ? 'bottom-0.5 right-0.5 w-4 h-4 text-[10px]' : 'bottom-1 right-1 w-5 h-5 text-xs'
            )}
          >
            {value}
          </div>
        )}
      </div>

      {/* Die Label */}
      {showLabel && positionLabel && size !== 'sm' && (
        <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700">
          {positionLabel}
        </span>
      )}
    </div>
  );
};

export default DieDisplay;
