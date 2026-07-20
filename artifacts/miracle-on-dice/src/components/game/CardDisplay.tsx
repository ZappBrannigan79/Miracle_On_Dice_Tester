import React from 'react';
import { Card as GameCard } from '@/game/types';
import { CARD_BG_IMAGES } from '@/game/assets';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Coins, ArrowLeftRight } from 'lucide-react';

interface CardDisplayProps {
  card: GameCard;
  onClick?: () => void;
  className?: string;
  faceDown?: boolean;
  compact?: boolean;
  selected?: boolean;
}

const tierLabel = (card: GameCard) => {
  if (card.category === 'penalty') return 'PEN';
  if (card.category === 'rookie')  return 'RK';
  if (card.isStarter)              return 'STR';
  return card.dieTypeId; // F2, D3, GS, etc.
};

const abilityTimingLabel: Record<string, string> = {
  initial_reveal: 'Initial Reveal',
  final_reveal:   'Final Reveal',
  on_score:       'On Score',
  on_block:       'On Block',
  passive:        'Passive',
};

const timingColor: Record<string, string> = {
  initial_reveal: 'text-sky-400',
  final_reveal:   'text-amber-400',
  on_score:       'text-green-400',
  on_block:       'text-blue-400',
  passive:        'text-slate-400',
};

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card, onClick, className, faceDown, compact = false, selected,
}) => {
  const bgImage = CARD_BG_IMAGES[card.category] ?? CARD_BG_IMAGES['rookie'];

  /* ── Face-down: show card back ── */
  if (faceDown) {
    return (
      <motion.div
        data-testid={`card-facedown`}
        whileHover={onClick ? { y: -4, scale: 1.03 } : {}}
        onClick={onClick}
        className={cn(
          'rounded-xl overflow-hidden shadow-lg relative',
          compact ? 'w-24 h-36' : 'w-40 h-56',
          onClick && 'cursor-pointer',
          selected && 'ring-2 ring-white',
          className,
        )}
      >
        <img
          src={CARD_BG_IMAGES['cardback']}
          alt="Card back"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </motion.div>
    );
  }

  /* ── Face-up card ── */
  const borderGlow = {
    forward:    'ring-blue-600 shadow-blue-900/50',
    defenseman: 'ring-red-600 shadow-red-900/50',
    goalie:     'ring-slate-500 shadow-slate-900/50',
    rookie:     'ring-slate-700 shadow-slate-900/30',
    penalty:    'ring-red-800 shadow-red-950/80',
  }[card.category];

  return (
    <motion.div
      data-testid={`card-${card.id}`}
      whileHover={onClick ? { y: -5, scale: 1.03 } : {}}
      onClick={onClick}
      className={cn(
        'rounded-xl overflow-hidden shadow-xl relative flex flex-col ring-2',
        compact ? 'w-24 h-36' : 'w-40 h-56',
        borderGlow,
        onClick && 'cursor-pointer',
        selected && 'ring-white scale-105',
        className,
      )}
    >
      {/* Card background art */}
      <img
        src={bgImage}
        alt={card.category}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Dark gradient overlay so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-1.5">
        {/* Top row: name + die type */}
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-display font-black leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]',
              compact ? 'text-[9px]' : 'text-xs',
            )}>
              {card.name}
            </p>
          </div>
          <span className={cn(
            'font-mono font-bold text-white/90 bg-black/60 rounded px-0.5 shrink-0 leading-none',
            compact ? 'text-[8px]' : 'text-[10px]',
          )}>
            {tierLabel(card)}
          </span>
        </div>

        {/* Cost / trade (hidden in compact) */}
        {!compact && card.cost > 0 && (
          <div className="flex gap-1.5 mb-1">
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-300 bg-black/60 rounded px-1 py-0.5">
              <Coins className="w-2.5 h-2.5" />{card.cost}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-black/60 rounded px-1 py-0.5">
              <ArrowLeftRight className="w-2.5 h-2.5" />{card.tradeValue}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Abilities panel at the bottom */}
        {card.abilities.length > 0 && (
          <div className={cn(
            'bg-black/75 rounded-lg p-1 space-y-0.5',
            compact && 'hidden',
          )}>
            {card.abilities.map((ab, i) => (
              <div key={i}>
                <span className={cn(
                  'text-[8px] font-bold uppercase tracking-wide block',
                  timingColor[ab.when] ?? 'text-slate-400',
                )}>
                  {abilityTimingLabel[ab.when] ?? ab.when}:
                </span>
                <p className="text-[9px] text-slate-200 italic leading-tight">
                  {ab.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* No ability cards */}
        {card.abilities.length === 0 && !compact && (
          <div className="bg-black/60 rounded-lg px-1.5 py-1 text-center">
            <p className="text-[9px] text-slate-400 italic">No special ability.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
