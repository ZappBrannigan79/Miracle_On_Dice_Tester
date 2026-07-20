import React from 'react';
import { Card } from '@/game/types';
import { cn } from '@/lib/utils';

interface CardDisplayProps {
  card: Card;
  selected?: boolean;
  faceDown?: boolean;
  className?: string;
  onClick?: () => void;
}

// Helper to resolve asset paths cleanly on GitHub Pages
const getAssetUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  selected,
  faceDown,
  className,
  onClick,
}) => {
  if (faceDown) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'w-48 h-64 rounded-xl bg-slate-800 border-2 border-slate-600 flex flex-col items-center justify-center p-4 shadow-xl cursor-pointer select-none relative overflow-hidden',
          className
        )}
      >
        <div className="w-full h-full border border-slate-700/50 rounded-lg flex items-center justify-center bg-slate-900/50">
          <span className="font-display text-2xl font-bold text-slate-500 uppercase tracking-widest">
            Rookie
          </span>
        </div>
      </div>
    );
  }

  const categoryColors = {
    forward: 'border-blue-600 bg-slate-900 shadow-blue-900/20',
    defenseman: 'border-red-600 bg-slate-900 shadow-red-900/20',
    goalie: 'border-amber-600 bg-slate-900 shadow-amber-900/20',
    rookie: 'border-slate-600 bg-slate-900 shadow-slate-900/20',
    penalty: 'border-purple-600 bg-slate-900 shadow-purple-900/20',
  };

  const badgeColors = {
    forward: 'bg-blue-600 text-white',
    defenseman: 'bg-red-600 text-white',
    goalie: 'bg-amber-600 text-white',
    rookie: 'bg-slate-600 text-white',
    penalty: 'bg-purple-600 text-white',
  };

  const imageUrl = getAssetUrl(card.imageUrl);

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-48 h-64 rounded-xl border-2 flex flex-col justify-between p-3 shadow-xl cursor-pointer select-none relative overflow-hidden transition-all duration-200',
        categoryColors[card.category] || 'border-slate-600 bg-slate-900',
        selected && 'ring-4 ring-white scale-105 z-20',
        className
      )}
    >
      {/* Background Graphic / Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={card.name}
          className="absolute inset-0 w-full h-full object-cover opacity-30 z-0 pointer-events-none"
          onError={(e) => {
            // Hide broken image gracefully if file is missing
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between relative z-10">
        <h4 className="font-display font-bold text-lg text-white leading-tight drop-shadow-md">
          {card.name}
        </h4>
        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ml-1',
            badgeColors[card.category] || 'bg-slate-700 text-white'
          )}
        >
          {card.category === 'forward'
            ? 'FWD'
            : card.category === 'defenseman'
            ? 'DEF'
            : card.category === 'goalie'
            ? 'G'
            : card.category}
        </span>
      </div>

      {/* Card Body / Ability */}
      <div className="relative z-10 my-auto bg-slate-950/70 backdrop-blur-sm border border-slate-800 rounded-lg p-2">
        <p className="text-xs text-slate-300 leading-snug italic text-center">
          {card.ability || 'No special ability.'}
        </p>
      </div>

      {/* Card Footer / Tier */}
      <div className="flex items-center justify-between relative z-10 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
        <span>Tier {card.tier}</span>
        {card.diceProfile && (
          <span className="font-mono text-slate-300 font-semibold">
            {card.diceProfile}
          </span>
        )}
      </div>
    </div>
  );
}
