import React from 'react';
import { useGame } from '@/game/context';
import { usePlayer } from '@/game/hooks';
import { TokenDisplay } from './TokenDisplay';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const HUD: React.FC = () => {
  const { state } = useGame();
  const p1 = usePlayer(0);
  const p2 = usePlayer(1);

  if (state.phase === 'setup' || state.phase === 'game_over') return null;

  return (
    <div className="w-full bg-slate-950 border-b-2 border-slate-800 p-4 flex flex-col gap-4 sticky top-0 z-50 shadow-2xl">
      {/* Top row: Match Info & Scoreboard */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1 w-1/4">
          <Badge variant="outline" className="w-fit border-primary/50 text-primary font-display uppercase tracking-widest text-sm">
            {state.isOvertimeMode ? 'OVERTIME' : `PERIOD ${state.period}`}
          </Badge>
          <span className="text-slate-400 font-mono text-xs">SHIFT {state.shift}</span>
        </div>

        {/* Scoreboard */}
        <div className="flex items-center gap-6 bg-slate-900 border-2 border-slate-800 rounded-xl px-8 py-2 box-glow-blue w-2/4 justify-center">
          <div className="text-right flex-1">
            <div className="text-slate-300 font-bold uppercase truncate">{p1.name}</div>
          </div>
          <div className="flex items-center gap-4 text-5xl font-display font-bold">
            <span className="text-primary w-12 text-center">{p1.score}</span>
            <span className="text-slate-600">:</span>
            <span className="text-destructive text-glow-red w-12 text-center">{p2.score}</span>
          </div>
          <div className="text-left flex-1">
            <div className="text-slate-300 font-bold uppercase truncate">{p2.name}</div>
          </div>
        </div>

        <div className="w-1/4 flex flex-col items-end gap-1">
          <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono">
            {state.phase.replace('phase', 'PHASE ').replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Bottom row: Token Banks & Event */}
      <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2 border border-slate-800">
        <div className="flex gap-4">
          <TokenDisplay type="energy" count={p1.tokens.energy} size="sm" />
          <TokenDisplay type="shoot" count={p1.tokens.shoot} size="sm" />
          <TokenDisplay type="block" count={p1.tokens.block} size="sm" />
        </div>
        
        <div className="flex-1 text-center px-4">
          {state.periods[state.period - 1]?.currentEvent && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Active Turn Event</span>
              <span className="text-sm font-bold text-amber-400">
                {state.periods[state.period - 1].currentEvent!.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <TokenDisplay type="block" count={p2.tokens.block} size="sm" />
          <TokenDisplay type="shoot" count={p2.tokens.shoot} size="sm" />
          <TokenDisplay type="energy" count={p2.tokens.energy} size="sm" />
        </div>
      </div>
    </div>
  );
};
