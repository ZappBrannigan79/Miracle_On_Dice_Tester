import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle, Badge } from 'lucide-react';
import { TurnEventCard } from '@/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// A single player's token-loss chooser. Shows one button per token type.
// For amount > 1 the player clicks multiple times (choices accumulate).
const TokenChooser: React.FC<{
  playerName: string;
  needed: number;
  onChoose: (token: 'energy' | 'shoot' | 'block') => void;
}> = ({ playerName, needed, onChoose }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="font-bold text-slate-200 shrink-0">
      {playerName} — lose {needed} token{needed > 1 ? 's' : ''}:
    </span>
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-yellow-500 text-yellow-300 hover:bg-yellow-500/20"
        onClick={() => onChoose('energy')}
      >
        ⚡ Energy
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-sky-500 text-sky-300 hover:bg-sky-500/20"
        onClick={() => onChoose('shoot')}
      >
        🎯 Shoot
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-red-500 text-red-400 hover:bg-red-500/20"
        onClick={() => onChoose('block')}
      >
        🛡 Block
      </Button>
    </div>
  </div>
);

export const TurnEventScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const periodIdx = state.period - 1;
  const currentEvent = state.periods[periodIdx]?.currentEvent;

  // Track how many tokens each player still needs to choose.
  // Key = playerId, value = remaining choices.
  const [remaining, setRemaining] = useState<Record<number, number>>({});
  const [initialised, setInitialised] = useState(false);

  const handleFlip = () => {
    dispatch({ type: 'FLIP_EVENT_CARD' });
  };

  const handleContinue = () => {
    dispatch({ type: 'CONTINUE_TO_LINEUP' });
  };

  // Build the list of players who need to make token choices, with how many.
  // We only compute this once per event reveal (when initialised flips).
  const needsChoiceEffects = (currentEvent?.effects ?? []).filter(
    e => e.immediateEffect?.type === 'lose_token' && (e.immediateEffect as any).tokenType === 'any'
  );

  // Map each affected player → total tokens to lose
  const requiredByPlayer: Record<number, number> = {};
  if (needsChoiceEffects.length > 0 && currentEvent) {
    const faceoffWinner = state.faceoff?.winner ?? 0;
    const faceoffLoser: 0 | 1 = faceoffWinner === 0 ? 1 : 0;

    for (const effect of needsChoiceEffects) {
      const amount = (effect.immediateEffect as any).amount ?? 1;
      const pids: (0 | 1)[] =
        effect.target === 'both' ? [0, 1] :
        effect.target === 'faceoff_winner' ? [faceoffWinner] :
        [faceoffLoser];

      for (const pid of pids) {
        requiredByPlayer[pid] = (requiredByPlayer[pid] ?? 0) + amount;
      }
    }
  }

  // Initialise remaining map on first render after event is visible.
  if (currentEvent && !initialised && Object.keys(requiredByPlayer).length > 0) {
    setInitialised(true);
    setRemaining({ ...requiredByPlayer });
  }
  if (!currentEvent && initialised) {
    setInitialised(false);
    setRemaining({});
  }

  const handleChoose = (pid: 0 | 1, token: 'energy' | 'shoot' | 'block') => {
    dispatch({ type: 'RESOLVE_IMMEDIATE_EVENT', playerId: pid, tokenLost: token, amount: 1 });
    setRemaining(prev => {
      const next = { ...prev, [pid]: (prev[pid] ?? 1) - 1 };
      if (next[pid] <= 0) delete next[pid];
      return next;
    });
  };

  const pendingPlayers = Object.entries(remaining)
    .filter(([, count]) => count > 0)
    .map(([pid, count]) => ({ pid: Number(pid) as 0 | 1, count }));

  const allChoicesMade = pendingPlayers.length === 0 && initialised;
  const needsAnyChoice = Object.keys(requiredByPlayer).length > 0;

  if (!currentEvent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-5xl font-display uppercase font-bold text-white mb-8 text-center drop-shadow-lg">
          Period {state.period} <span className="text-slate-500 px-4">•</span> Shift {state.shift}
        </h1>
        <motion.div
          whileHover={{ scale: 1.05, y: -10 }}
          className="w-72 h-[26rem] bg-slate-800 border-4 border-slate-600 rounded-xl cursor-pointer flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          onClick={handleFlip}
          data-testid="button-flip-event"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-800 to-slate-950" />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-6 shadow-inner">
              <Zap className="w-12 h-12 text-slate-500 group-hover:text-amber-400 transition-colors duration-500" />
            </div>
            <h2 className="text-3xl font-display uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors duration-300">
              Draw Event
            </h2>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
      <AnimatePresence>
        <motion.div
          initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="w-80 h-[28rem] bg-slate-900 border-2 border-amber-500/50 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col overflow-hidden relative z-10"
        >
          <div className="bg-amber-500 text-amber-950 text-center py-3 font-display text-2xl font-bold uppercase tracking-widest relative">
            {currentEvent.isStandardShift ? 'Standard Shift' : 'Turn Event'}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
          </div>

          <div className="flex-1 p-6 flex flex-col items-center text-center bg-gradient-to-b from-slate-800 to-slate-900">
            <h3 className="text-3xl font-display font-bold text-white mb-6 drop-shadow-md">{currentEvent.name}</h3>

            <div className="space-y-4 w-full">
              {currentEvent.effects.map((effect, idx) => (
                <div key={idx} className="bg-slate-950/50 p-4 rounded-lg border border-slate-700 shadow-inner">
                  <Badge variant="outline" className="mb-2 bg-slate-900 font-mono text-[10px] text-slate-400 border-slate-600">
                    {effect.timing.toUpperCase()} • {effect.target.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-slate-300 text-sm leading-relaxed">{effect.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-6 w-full max-w-2xl z-10"
      >
        {/* Token-loss chooser — shown while any player still has tokens to lose */}
        {needsAnyChoice && !allChoicesMade && (
          <Card className="w-full bg-slate-900 border-red-500/60">
            <CardHeader className="py-3 bg-red-500/10">
              <CardTitle className="text-lg flex items-center text-red-400">
                <AlertCircle className="w-5 h-5 mr-2" /> Token Loss — Choose for Each Player
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-4">
              {pendingPlayers.map(({ pid, count }) => (
                <TokenChooser
                  key={pid}
                  playerName={state.players[pid].name}
                  needed={count}
                  onChoose={token => handleChoose(pid, token)}
                />
              ))}
              {/* Players who've finished show a ✓ */}
              {Object.entries(requiredByPlayer)
                .filter(([pid]) => !pendingPlayers.find(p => p.pid === Number(pid)))
                .map(([pid]) => (
                  <div key={pid} className="flex items-center gap-3 text-green-400">
                    <span className="text-xl">✓</span>
                    <span className="font-bold">{state.players[Number(pid) as 0|1].name} done</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {needsAnyChoice && allChoicesMade && (
          <div className="flex items-center gap-3 text-green-400 font-bold text-lg">
            <span className="text-2xl">✓</span> All token losses resolved
          </div>
        )}

        <Button
          size="lg"
          className="h-14 px-12 text-xl font-display uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all hover:scale-105"
          onClick={handleContinue}
          disabled={needsAnyChoice && !allChoicesMade}
          data-testid="button-continue-to-lineup"
        >
          To The Bench
        </Button>
      </motion.div>
    </div>
  );
};
