import React from 'react';
import { RolledDie } from '@/game/types';
import { DIE_FACE_IMAGES } from '@/game/assets';
import { cn } from '@/lib/utils';
import { Zap, Target, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface DieDisplayProps {
  die: RolledDie;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  className?: string;
  animateRoll?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const faceImage = (faceType: string) => DIE_FACE_IMAGES[faceType] ?? DIE_FACE_IMAGES['blank'];

/** Corner-fill bg colour and ring colour keyed by die-type prefix */
const dieColors = (dieTypeId: string): { ring: string; bg: string; shadow: string } => {
  if (dieTypeId.startsWith('F') || dieTypeId === 'FS')
    return { ring: 'ring-blue-500',   bg: 'bg-blue-900',   shadow: 'shadow-blue-900/60' };
  if (dieTypeId.startsWith('D') || dieTypeId === 'DS')
    return { ring: 'ring-red-500',    bg: 'bg-red-900',    shadow: 'shadow-red-900/60' };
  if (dieTypeId.startsWith('G') || dieTypeId === 'GS')
    return { ring: 'ring-slate-400',  bg: 'bg-slate-600',  shadow: 'shadow-slate-900/60' };
  // Rookie / Combat
  return   { ring: 'ring-slate-300',  bg: 'bg-slate-400',  shadow: 'shadow-slate-900/40' };
};

export const DieDisplay: React.FC<DieDisplayProps> = ({
  die, onClick, selectable, selected, className, animateRoll, size = 'md',
}) => {
  const { ring, bg, shadow } = dieColors(die.dieTypeId);

  const sizeClasses = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' }[size];
  const labelSize  = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' }[size];
  const numSize    = { sm: 'text-base',  md: 'text-xl',    lg: 'text-2xl' }[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.div
        data-testid={`die-${die.id}`}
        initial={animateRoll ? { rotate: -270, scale: 0.4, opacity: 0 } : false}
        animate={animateRoll ? { rotate: 0, scale: 1, opacity: 1 } : false}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        onClick={selectable ? onClick : undefined}
        className={cn(
          'relative rounded-2xl overflow-hidden shadow-lg transition-all duration-150',
          sizeClasses,
          bg,           // corner fill matches die type
          'ring-4',     // thicker ring
          ring,
          shadow,
          selectable && 'cursor-pointer hover:scale-110 hover:brightness-110',
          selected   && 'ring-white scale-110 brightness-125',
          die.rerolled && 'opacity-40 grayscale',
        )}
      >
        {/* Pip face image — covers most of the die face */}
        <img
          src={faceImage(die.face.type)}
          alt={die.face.type}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Pip count — white, centred in the lower ~30% of the die */}
        {die.face.type !== 'blank' && die.face.type !== 'shutout' && die.face.value > 0 && (
          <span
            className={cn(
              'absolute bottom-0 left-0 right-0 text-center',
              'font-display font-black leading-none text-white',
              'drop-shadow-[0_1px_4px_rgba(0,0,0,1)]',
              numSize,
            )}
          >
            {die.face.value}
          </span>
        )}

        {/* Wild assignment badge */}
        {die.wildAssignedAs && (
          <div className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-slate-600 rounded-full w-5 h-5 flex items-center justify-center z-10 shadow">
            {die.wildAssignedAs === 'energy' && <Zap    className="w-3 h-3 text-yellow-400" />}
            {die.wildAssignedAs === 'shoot'  && <Target className="w-3 h-3 text-sky-400" />}
            {die.wildAssignedAs === 'block'  && <Shield className="w-3 h-3 text-red-400" />}
          </div>
        )}

        {/* Rerolled overlay */}
        {die.rerolled && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-20">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rerolled</span>
          </div>
        )}
      </motion.div>

      {/* Die-type label below the face */}
      <span className={cn(
        'font-mono font-bold uppercase tracking-widest',
        labelSize,
        ring.replace('ring-', 'text-'),   // same colour as the ring
      )}>
        {die.dieTypeId}
      </span>
    </div>
  );
};
