import React, { useEffect } from 'react';
import { useGame } from '@/game/context';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Zap, Target, Shield, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FinalRevealScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const p1 = state.players[0];
  const p2 = state.players[1];

  useEffect(() => {
    dispatch({ type: 'REVEAL_ROLLS' });
  }, [dispatch]);

  const handleDetermineInitiative = () => {
    dispatch({ type: 'DETERMINE_INITIATIVE' });
  };

  const PlayerSummary = ({ player, flip }: { player: any; flip?: boolean }) => (
    <div className={cn(
      'flex flex-col w-[45%] bg-slate-900 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl',
      flip && 'items-end',
    )}>
      <div className="bg-slate-800 p-4 border-b border-slate-700 w-full text-center">
        <h3 className="text-2xl font-display uppercase tracking-widest font-bold text-white">{player.name}</h3>
      </div>

      <div className="p-6 flex flex-col gap-6 w-full">
        {/* Shoot */}
        <div className={cn('flex items-center gap-6', flip && 'flex-row-reverse text-right')}>
          <div className="w-24 h-24 rounded-xl bg-sky-500/10 border-2 border-sky-500/50 flex flex-col items-center justify-center relative shrink-0">
            <Target className="w-8 h-8 text-sky-500 opacity-25 absolute" />
            <span className="text-5xl font-display font-black text-white relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {player.shootPipsTotal}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-300 uppercase tracking-widest">Shoot Pips</h4>
            <p className="text-sm text-slate-500">Determines Initiative</p>
          </div>
        </div>

        {/* Block */}
        <div className={cn('flex items-center gap-6', flip && 'flex-row-reverse text-right')}>
          <div className="w-24 h-24 rounded-xl bg-red-500/10 border-2 border-red-500/50 flex flex-col items-center justify-center relative shrink-0">
            <Shield className="w-8 h-8 text-red-500 opacity-25 absolute" />
            <span className="text-5xl font-display font-black text-white relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {player.blockPipsTotal + player.goalieBlockPips}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-300 uppercase tracking-widest">Block Pips</h4>
            {player.goalieShutout ? (
              <p className="text-sm font-bold text-red-300 uppercase animate-pulse">Shutout Rolled!</p>
            ) : (
              <p className="text-sm text-slate-500">Base defense</p>
            )}
          </div>
        </div>

        {/* Energy */}
        <div className={cn('flex items-center gap-6', flip && 'flex-row-reverse text-right')}>
          <div className="w-24 h-24 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/50 flex flex-col items-center justify-center relative shrink-0">
            <Zap className="w-8 h-8 text-yellow-500 opacity-25 absolute" />
            <span className="text-5xl font-display font-black text-white relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              +{player.energyPipsTotal}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-300 uppercase tracking-widest">Energy Gained</h4>
            <p className="text-sm text-slate-500">Converted to tokens</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-slate-950">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold text-white uppercase tracking-widest">Final Reveal</h2>
        <p className="text-slate-400">All screens lifted. Compare totals for initiative.</p>
      </div>

      <div className="flex w-full max-w-5xl justify-between items-center relative flex-1 mb-8">
        <PlayerSummary player={p1} />

        <div className="absolute left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-900 border-4 border-slate-700 rounded-full flex flex-col items-center justify-center z-10 shadow-2xl">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">VS</span>
          <Dices className="text-primary w-8 h-8" />
        </div>

        <PlayerSummary player={p2} flip />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          size="lg"
          className="h-16 px-12 text-2xl font-display uppercase tracking-widest bg-destructive hover:bg-destructive/90 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]"
          onClick={handleDetermineInitiative}
        >
          Determine Initiative
        </Button>
      </motion.div>
    </div>
  );
};
