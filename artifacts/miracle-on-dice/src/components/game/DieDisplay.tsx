import React from 'react';
import { cn } from '@/lib/utils';

interface DieDisplayProps {
  rolls?: any[];
  roll?: any;
  onDieClick?: (index: number) => void;
  selectedIndices?: number[];
  onClick?: () => void;
  selected?: boolean;
}

export const DieDisplay: React.FC<DieDisplayProps> = (props) => {
  const { rolls, roll, onDieClick, selectedIndices = [], onClick, selected } = props;

  // Handle single die vs array of rolls
  const diceList = rolls ? rolls : roll ? [roll] : [];

  // Border color based on player category
  const getCategoryBorder = (category?: string) => {
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
  const getDieLabel = (item: any, index: number) => {
    if (item?.sourceLabel) return item.sourceLabel;
    if (item?.category === 'forward') return `F${index + 1}`;
    if (item?.category === 'defenseman') return `D${index + 1}`;
    if (item?.category === 'rookie') return 'Rookie';
    if (item?.category === 'goalie') return 'Goalie';
    return `Die ${index + 1}`;
  };

  return (
    <div className="flex flex-wrap gap-4 items-center justify-start py-2">
      {diceList.map((item: any, idx: number) => {
        const isSelected = selected || selectedIndices.includes(idx);
        const category = item?.category || item?.playerCategory;
        const borderColor = getCategoryBorder(category);
        const label = getDieLabel(item, idx);

        // Value check: suppress 0-pip badges (fixes "Block 0")
        const val = typeof item?.value === 'number' ? item.value : 0;
        const displayValue = val > 0 ? val : '';
        const dieType = item?.type || item?.faceType || '';

        return (
          <div
            key={idx}
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={() => {
              if (onDieClick) onDieClick(idx);
              if (onClick) onClick();
            }}
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
              {item?.faceImage || item?.image ? (
                <img
                  src={item.faceImage || item.image}
                  alt={dieType}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="font-display font-bold text-lg text-white uppercase">
                  {dieType}
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
              {label} {displayValue && dieType ? `(${displayValue}${dieType[0]?.toUpperCase()})` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DieDisplay;
