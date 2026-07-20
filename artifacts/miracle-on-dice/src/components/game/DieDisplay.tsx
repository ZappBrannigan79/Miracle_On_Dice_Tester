import React from 'react';
import { DieRoll, PlayerCategory } from '@/game/types';
import { cn } from '@/lib/utils';

interface DiceDisplayProps {
  rolls: DieRoll[];
  onDieClick?: (index: number) => void;
  selectedIndices?: number[];
}

export const DiceDisplay: React.FC<DiceDisplayProps> = ({
  rolls,
  onDieClick,
  selectedIndices = [],
}) => {
  // Border color based on player category
  const getCategoryBorder = (category?: PlayerCategory) => {
    switch (category) {
      case 'forward':
        return 'border-blue-500 shadow-blue-500/30';
      case 'defenseman':
        return 'border-red-500 shadow-red-500/30';
      case 'rookie':
        return 'border-slate-100 shadow-white/30';
      case 'goalie':
        return 'border-slate-400 shadow-slate-400/30';
      default:
        return 'border-amber-400 shadow-amber-400/30';
    }
  };

  // Label text formatting (e.g., F1, D2, Goalie, Rookie)
  const getDieLabel = (roll: DieRoll, index: number) => {
    if (roll.sourceLabel) return roll.sourceLabel;
    if (roll.category === 'forward') return `F${index + 1}`;
    if (roll.category === 'defenseman') return `D${index + 1}`;
    if (roll.category === 'rookie') return 'Rookie';
    if (roll.category === 'goalie') return 'Goalie';
    return `Die ${index + 1}`;
  };

  return (
    <div className="flex flex-wrap gap-4 items-center justify-start py-2">
      {rolls.map((roll, idx) => {
        const isSelected = selectedIndices.includes(idx);
        const borderColor = getCategoryBorder(roll.category);
        const label = getDieLabel(roll, idx);

        // Safeguard against "Block 0" or blank values
        const displayValue = roll.value > 0 ? roll.value : '';

        return (
          <div
            key={idx}
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={() => onDieClick && onDieClick(idx)}
          >
            {/* Die Box with Color-Coded Border */}
            <div
              className={cn(
                'relative w-16 h-16 rounded-xl border-4 bg-slate-900 flex items-center justify-center transition-all duration-200 shadow-lg',
                borderColor,
                isSelected && 'ring-4 ring-yellow-400 scale-105',
                'group-hover:scale-105'
              )}
            >
              {/* Image / Face Icon */}
              {roll.faceImage ? (
                <img
                  src={roll.faceImage}
                  alt={roll.type}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="font-display font-bold text-lg text-white uppercase">
                  {roll.type}
                </span>
              )}

              {/* Pip Badge (Hides if 0 to avoid "Block 0") */}
              {displayValue !== '' && (
                <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {displayValue}
                </div>
              )}
            </div>

            {/* Position Label below the die */}
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {label} {displayValue ? `(${displayValue}${roll.type[0].toUpperCase()})` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};
