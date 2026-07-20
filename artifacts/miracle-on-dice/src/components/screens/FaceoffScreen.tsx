import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { Button } from '@/components/ui/button';
import { rollD6 } from '@/game/dice';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, ChevronRight } from 'lucide-react';

export const FaceoffScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const p1 = state.players[0];
  const p2 = state.players[1];

  // Buffer rolls locally so we can show BOTH results before advancing phase.
  // Player 0's roll is dispatched immediately (phase stays on phase1).
  // Player 1's roll is held locally until "Continue" is clicked, then dispatched
  // (which is when the reducer advances to phase2).
  const [localRolls, setLocalRolls] = useState<[number | null, number | null]>([null, null]);
  const [awaitingContinue, setAwaitingContinue] = useState(false);

  const hasP1Local = localRolls[0] !== null;
  const hasP2Local = localRolls[1] !== null;

  const handleRoll = (playerId: 0 | 1) => {
    const roll = rollD6();
    if (playerId === 0) {
      dispatch({ type: 'ROLL_FACEOFF', playerId: 0, roll });
      setLocalRolls([roll, null]);
    } else {
      // Hold locally — don't dispatch yet so we can show the result
      setLocalRolls(prev => [prev[0], roll]);
      setAwaitingContinue(true);
    }
  };

  const handleContinue = () => {
    const roll = localRolls[1]!;
    // This dispatch may advance phase (winner) or reset (tie)
    dispatch({ type: 'ROLL_FACEOFF', playerId: 1, roll });

    // If it's a tie the reducer resets faceoff; we reset local state too
    if (localRolls[0] === roll) {
      setLocalRolls([null, null]);
      setAwaitingContinue(false);
    }
    // If not a tie, the phase changes and this screen unmounts
  };

  const PlayerArea = ({
    playerId,
    player,
    roll,
    hasRolled,
  }: {
    playerId: 0 | 1;
    player: any;
    roll: number | null;
    hasRolled: boolean;
  }) => {
    // Player 1 can only roll after player 0 has rolled
    const canRoll = playerId === 0 ? !hasRolled : hasP1Local && !hasRolled;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        <h2 className="text-3xl font-display uppercase tracking-widest text-slate-300">
          {player.name}
        </h2>

        <div className="h-40 flex items-center justify-center">
          {hasRolled ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-28 h-28 bg-slate-800 border-4 border-slate-600 rounded-2xl flex flex-col items-center justify-center shadow-2xl"
            >
              <span className="text-6xl font-bold font-display text-white">{roll}</span>
            </motion.div>
          ) : canRoll ? (
            <Button
              size="lg"
              className="h-16 px-8 text-xl font-display uppercase tracking-widest bg-slate-700 hover:bg-slate-600"
              onClick={() => handleRoll(playerId)}
              data-testid={`button-roll-faceoff-${playerId}`}
            >
              Roll Faceoff
            </Button>
          ) : (
            <div className="w-28 h-28 border-4 border-dashed border-slate-700 rounded-2xl flex items-center justify-center">
              <span className="text-slate-600 text-sm uppercase tracking-widest font-bold text-center">
                Waiting…
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col pt-16">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-display uppercase font-bold text-white mb-2">Faceoff</h1>
        <p className="text-slate-400">Roll to win puck control and turn events</p>
      </div>

      <div className="flex-1 flex relative">
        {/* Divider */}
        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-slate-800 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center z-10">
          <Dices className="text-slate-500" />
        </div>

        <PlayerArea playerId={0} player={p1} roll={localRolls[0]} hasRolled={hasP1Local} />
        <PlayerArea playerId={1} player={p2} roll={localRolls[1]} hasRolled={hasP2Local} />
      </div>

      {/* Results bar + continue — only visible when both have rolled locally */}
      <AnimatePresence>
        {awaitingContinue && hasP1Local && hasP2Local && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mx-8 mb-8 bg-slate-900 border-2 border-primary/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.2)] flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              {localRolls[0] === localRolls[1] ? (
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-amber-400 uppercase tracking-widest">Tie — Reroll!</p>
                  <p className="text-slate-500 text-sm mt-1">Both rolled {localRolls[0]}. Roll again.</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-primary uppercase tracking-widest">
                    {localRolls[0]! > localRolls[1]! ? p1.name : p2.name} wins the faceoff!
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {p1.name} rolled {localRolls[0]} &nbsp;·&nbsp; {p2.name} rolled {localRolls[1]}
                  </p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="h-14 px-8 font-display text-lg uppercase tracking-widest bg-primary hover:bg-primary/90 shrink-0"
              onClick={handleContinue}
            >
              {localRolls[0] === localRolls[1] ? 'Reroll' : 'Continue'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
