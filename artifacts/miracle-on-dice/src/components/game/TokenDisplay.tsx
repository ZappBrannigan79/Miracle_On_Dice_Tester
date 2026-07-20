import React from 'react';
import { Zap, Target, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TokenDisplayProps {
  type: 'energy' | 'shoot' | 'block';
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  type, count, className, size = 'md', showLabel = false,
}) => {
  const config = {
    energy: {
      color: 'bg-yellow-400 border-yellow-300 text-yellow-950',
      icon: Zap,
      label: 'Energy',
      glow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    },
    shoot: {
      color: 'bg-sky-500 border-sky-400 text-sky-950',
      icon: Target,
      label: 'Shoot',
      glow: 'shadow-[0_0_10px_rgba(14,165,233,0.5)]',
    },
    block: {
      color: 'bg-red-500 border-red-400 text-red-950',
      icon: Shield,
      label: 'Block',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    },
  };

  const c = config[type];
  const Icon = c.icon;

  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-2xl' };
  const iconSizes  = { sm: 'w-3 h-3',           md: 'w-5 h-5',           lg: 'w-6 h-6' };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        key={count}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center font-display font-bold font-numeric',
          c.color, c.glow, sizeClasses[size],
        )}
      >
        <Icon className={cn('absolute opacity-30', iconSizes[size])} />
        <span className="relative z-10">{count}</span>
      </motion.div>
      {showLabel && (
        <span className="font-display font-bold uppercase tracking-wider text-slate-300">
          {c.label}
        </span>
      )}
    </div>
  );
};
