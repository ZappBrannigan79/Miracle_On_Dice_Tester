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

// Map card categories directly to your assets in public/assets/cards/
const CATEGORY_BACKGROUNDS: Record<string, string> = {
  forward: '/assets/cards/bg_forward.png',
  defenseman: '/assets/cards/bg_defense.png',
  goalie: '/assets/cards/bg_goalie.png',
  rookie: '/assets/cards/bg_rookie.png',
  penalty: '/assets/cards/bg_penalty.png',
};

// Helper to handle Vite / GitHub Pages subpaths cleanly
const getAssetUrl = (path: string) => {
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
        <img
          src={getAssetUrl('/assets/cards/cardback.png')}
          alt="Card Back"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="z-10 bg-slate-950/80 px-3 py-1 rounded border border-slate-700">
          <span className="font-display text-xl font-bold text-slate-300 uppercase tracking-widest">
            Rookie
          </span>
        </div>
      </div>
    );
  }

  const categoryColors = {
    forward: 'border-blue-500 bg-slate-900 shadow-blue-900/20',
    defenseman: 'border-red-500 bg-slate-900 shadow-red-900/20',
    goalie: 'border-amber-500 bg-slate-900 shadow-amber-900/20',
    rookie: 'border-slate-500 bg-slate-900 shadow-slate-900/20',
    penalty: 'border-purple-500 bg-slate-900 shadow-purple-900/20',
  };

  const badgeColors = {
    forward: 'bg-blue-600 text-white',
    defenseman: 'bg-red-600 text-white',
    goalie: 'bg-amber-600 text-white',
    rookie: 'bg-slate-600 text-white',
    penalty: 'bg-purple-600 text-white',
  };

  // Determine image: explicit card imageUrl OR category background fallback
  const rawImagePath = card.imageUrl || CATEGORY_BACKGROUNDS[card.category] || CATEGORY_BACKGROUNDS.rookie;
  const imageUrl = getAssetUrl(rawImagePath);

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
      {/* Background Graphic */}
      <img
        src={imageUrl}
        alt={card.name}
        className="absolute inset-0 w-full h-full object-cover opacity-80 z-0 pointer-events-none"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between relative z-10">
        <h4 className="font-display font-bold text-base text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {card.name}
        </h4>
        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ml-1 shadow-md',
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
      <div className="relative z-10 my-auto bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-lg p-2.5 shadow-lg">
        <p className="text-xs text-slate-200 leading-snug italic text-center font-medium">
          {card.abilities && card.abilities.length > 0
            ? card.abilities.map(a => a.description).join(' ')
            : 'No special ability.'}
        </p>
      </div>

      {/* Card Footer / Tier */}
      <div className="flex items-center justify-between relative z-10 text-[10px] text-slate-300 font-semibold border-t border-slate-700/80 pt-1 bg-slate-950/60 -mx-1 px-2 rounded-b">
        <span>Tier {card.tier}</span>
        {card.dieTypeId && (
          <span className="font-mono text-amber-300">
            {card.dieTypeId}
          </span>
        )}
      </div>
    </div>
  );
};
