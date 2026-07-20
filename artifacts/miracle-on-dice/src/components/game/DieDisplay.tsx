import React from 'react';
import { DieRoll } from '@/game/types';
import { cn } from '@/lib/utils';

export interface DieDisplayProps {
  roll?: DieRoll;
  rolls?: DieRoll[];
  index?: number;
  isSelected?: boolean;
  selectedIndices?: number[];
  onClick?: () => void;
  onDieClick?: (index: number) => void;
  showCategoryBorder?: boolean;
  showLabel?: boolean;
  className?: string;
}

// Color-coded borders by position category
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

// Formats position tags (e.g. F1, F2, D1, Rookie, Goalie)
const getDieLabel = (roll: DieRoll, index: number) => {
  if (roll.sourceLabel) return roll.sourceLabel;
  if (roll.category === 'forward') return `F${index + 1}`;
  if (roll.category === 'defenseman') return `D${index + 1}`;
  if (roll.category === 'rookie') return 'Rookie';
  if (roll.category === 'goalie') return 'Goalie';
  return `Die ${index + 1}`;
};

// Single Die Render Block
export const SingleDie: React.FC<{
  roll: DieRoll;
  index?: number;
  isSelected?: boolean;
  onClick?: () => void;
  showCategoryBorder?: boolean;
  showLabel?: boolean;
}> = ({
  roll,
  index = 0,
  isSelected = false,
  onClick,
  showCategoryBorder = true,
  showLabel = true,
}) => {
  const category = roll.category || (roll as any).playerCategory;
  const borderColor = showCategoryBorder ? getCategoryBorder(category) : 'border-amber-400';
  const label = getDieLabel(roll, index);

  // Suppress "0" pip display on blank or zero-pip faces to avoid "Block 0"
  const val = typeof roll.value === 'number' ? roll.value : 0;
  const displayValue = val > 0 ? val : '';
  const dieType = roll.type || (roll as any).faceType || '';

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer group"
      onClick={onClick}
    >
      <div
        className={cn(
          'relative w-16 h-16 rounded-xl border-4 bg-slate-900 flex items-center justify-center transition-all duration-200 shadow-lg',
          borderColor,
          isSelected && 'ring-4 ring-yellow-400 scale-105',
          'group-hover:scale-105'
        )}
      >
        {/* Face Graphic or Text Fallback */}
        {roll.faceImage || (roll as any).image ? (
          <img
            src={roll.faceImage || (roll as any).image}
            alt={dieType}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="font-display font-bold text-lg text-white uppercase">
            {dieType}
          </span>
        )}

        {/* Pip Badge (Hidden when displayValue is empty, preventing "Block 0") */}
        {displayValue !== '' && (
          <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow">
            {displayValue}
          </div>
        )}
      </div>

      {/* Position Tag Label below die */}
      {showLabel && (
        <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          {label} {displayValue && dieType ? `(${displayValue}${dieType[0]?.toUpperCase()})` : ''}
        </span>
      )}
    </div>
  );
};

// Primary DieDisplay Component (Supports both array of rolls and single roll)
export const DieDisplay: React.FC<DieDisplayProps> = (props) => {
  const {
    rolls,
    roll,
    onDieClick,
    onClick,
    selectedIndices = [],
    isSelected = false,
    index = 0,
    showCategoryBorder = true,
    showLabel = true,
    className,
  } = props;

  if (rolls && rolls.length > 0) {
    return (
      <div className={cn('flex flex-wrap gap-4 items-center justify-start py-2', className)}>
        {rolls.map((r, idx) => (
          <SingleDie
            key={idx}
            roll={r}
            index={idx}
            isSelected={selectedIndices.includes(idx)}
            onClick={() => onDieClick && onDieClick(idx)}
            showCategoryBorder={showCategoryBorder}
            showLabel={showLabel}
          />
        ))}
      </div>
    );
  }

  if (roll) {
    return (
      <SingleDie
        roll={roll}
        index={index}
        isSelected={isSelected}
        onClick={onClick}
        showCategoryBorder={showCategoryBorder}
        showLabel={showLabel}
      />
    );
  }

  return null;
};

export default DieDisplay;
