import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Shield, AlertTriangle, Play, ChevronRight } from 'lucide-react';
import { rollD6, rollCombatDice } from '@/game/dice';
import { WaveResult } from '@/game/types';

// ----------------------------------------------------------------
// Wave Result Panel — shown after Resolve Wave is clicked
// ----------------------------------------------------------------
interface LocalWaveResult {
  wave: 1 | 2;
  attackerName: string;
  defenderName: string;
  attackPips: number;
  attackTokens: number;
  attackRolls: number[];
  attackTotal: number;
  blockPips: number;
  blockTokens: number;
  blockRolls: number[];
  shutoutContrib: number;
  blockTotal: number;
  isGoal: boolean;
}

const WaveResultPanel: React.FC<{
  result: LocalWaveResult;
  onContinue: () => void;
  isLastWave: boolean;
}> = ({ result, onContinue, isLastWave }) => {
  const rollList = (rolls: number[]) =>
    rolls.length === 0 ? '—' : `[${rolls.join(', ')}] = ${rolls.reduce((a, b) => a + b, 0)}`;

  return (
    <motion.div
      key="wave-result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden"
    >
      {/* Outcome glow */}
      <div
        className={`absolute inset-0 pointer-events-none ${result.isGoal ? 'bg-red-900/20' : 'bg-sky-900/20'}`}
      />

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-slate-400 uppercase tracking-widest text-sm mb-1">Wave {result.wave} Result</p>
          <motion.h2
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className={`text-6xl font-display font-black uppercase tracking-widest drop-shadow-lg ${
              result.isGoal ? 'text-red-400' : 'text-sky-400'
            }`}
          >
            {result.isGoal ? '🚨 GOAL!' : '🛡 SAVED!'}
          </motion.h2>
        </div>

        {/* Side-by-side breakdown */}
        <div className="grid grid-cols-2 gap-6">
          {/* Attack */}
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl p-6 space-y-3">
            <h3 className="text-red-400 font-display font-bold uppercase tracking-widest text-lg border-b border-red-500/20 pb-2">
              ⚔ {result.attackerName} — Attack
            </h3>
            <Row label="Shoot pips" value={result.attackPips} color="text-white" />
            <Row label="Committed tokens" value={`+${result.attackTokens}`} color="text-yellow-400" />
            <Row label="Combat dice" value={rollList(result.attackRolls)} color="text-slate-300" mono />
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
              <span className="font-display font-bold text-white uppercase tracking-wide">Total</span>
              <span className="text-4xl font-display font-black text-red-400">{result.attackTotal}</span>
            </div>
          </div>

          {/* Block */}
          <div className="bg-slate-900 border-2 border-sky-500/50 rounded-2xl p-6 space-y-3">
            <h3 className="text-sky-400 font-display font-bold uppercase tracking-widest text-lg border-b border-sky-500/20 pb-2">
              🛡 {result.defenderName} — Defense
            </h3>
            <Row label="Block pips" value={result.blockPips} color="text-white" />
            <Row label="Committed tokens" value={`+${result.blockTokens}`} color="text-sky-300" />
            {result.shutoutContrib > 0 && (
              <Row label="Goalie shutout" value={`+${result.shutoutContrib}`} color="text-amber-400" />
            )}
            <Row label="Combat dice" value={rollList(result.blockRolls)} color="text-slate-300" mono />
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
              <span className="font-display font-bold text-white uppercase tracking-wide">Total</span>
              <span className="text-4xl font-display font-black text-sky-400">{result.blockTotal}</span>
            </div>
          </div>
        </div>

        {result.isGoal && (
          <p className="text-center text-green-400 font-bold text-sm">
            +2 ⚡ Energy bonus awarded to {result.attackerName}
          </p>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            className={`h-14 px-14 text-xl font-display uppercase tracking-widest shadow-lg transition-all hover:scale-105 ${
              result.isGoal
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-sky-700 hover:bg-sky-600 text-white'
            }`}
            onClick={onContinue}
          >
            <ChevronRight className="w-5 h-5 mr-2" />
            {isLastWave ? 'Proceed to Buy Phase' : 'Next Wave'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const Row: React.FC<{ label: string; value: string | number; color: string; mono?: boolean }> = ({
  label, value, color, mono,
}) => (
  <div className="flex justify-between items-center gap-2">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className={`font-bold text-sm ${color} ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

// ----------------------------------------------------------------
// Main Screen
// ----------------------------------------------------------------
export const ShootingPhaseScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const combat = state.combat!;

  const [blocksToCommit, setBlocksToCommit] = useState(0);
  const [pendingResult, setPendingResult] = useState<LocalWaveResult | null>(null);

  // Initiative Tiebreaker
  if (combat.initiativeWinner === null && !combat.initiativeRolls) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
        <AlertTriangle className="w-24 h-24 text-amber-500 mb-6" />
        <h2 className="text-4xl font-display font-bold text-white mb-4 uppercase tracking-widest">Initiative Tie!</h2>
        <p className="text-xl text-slate-400 mb-8">Both players tied on Shoot pips. Roll to break the tie.</p>
        <Button
          size="lg"
          className="h-16 px-12 text-2xl font-display uppercase bg-amber-600 hover:bg-amber-500 text-white"
          onClick={() => dispatch({ type: 'ROLL_INITIATIVE_TIEBREAKER', rolls: [rollD6(), rollD6()] })}
        >
          Roll Tiebreaker
        </Button>
      </div>
    );
  }

  const currentWave: 1 | 2 = !combat.wave1 ? 1 : 2;
  const isWave2Done = !!combat.wave2;

  // Show result panel if we just resolved a wave (pendingResult set)
  if (pendingResult) {
    return (
      <AnimatePresence mode="wait">
        <WaveResultPanel
          key="result"
          result={pendingResult}
          isLastWave={pendingResult.wave === 2 || isWave2Done}
          onContinue={() => {
            setPendingResult(null);
            setBlocksToCommit(0);
            if (pendingResult.wave === 2 || isWave2Done) {
              dispatch({ type: 'END_BUY_PHASE', playerId: 0 });
            }
          }}
        />
      </AnimatePresence>
    );
  }

  if (isWave2Done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <h2 className="text-5xl font-display font-bold text-white mb-6 uppercase">Shift Complete</h2>
        <Button
          size="lg"
          className="h-16 px-12 text-2xl font-display uppercase bg-primary hover:bg-primary/90"
          onClick={() => dispatch({ type: 'END_BUY_PHASE', playerId: 0 })}
        >
          Proceed to Buy Phase
        </Button>
      </div>
    );
  }

  const attackerId = currentWave === 1 ? combat.initiativeWinner! : (combat.initiativeWinner === 0 ? 1 : 0);
  const defenderId: 0 | 1 = attackerId === 0 ? 1 : 0;
  const attacker = state.players[attackerId];
  const defender = state.players[defenderId];

  const baseAttack = attacker.shootPipsTotal + attacker.shootTokensCommitted;

  const handleResolveWave = () => {
    const attackRolls = rollCombatDice(attacker.shootPipsTotal).rolls;
    const blockRolls = rollCombatDice(defender.blockPipsTotal + defender.goalieBlockPips).rolls;

    const attackPipTotal = attackRolls.reduce((s, v) => s + v, 0);
    const attackTotal = attackPipTotal + attacker.shootTokensCommitted;

    const blockPipTotal = blockRolls.reduce((s, v) => s + v, 0);
    const shutoutContrib = defender.goalieShutout ? 5 : 0;
    const blockTotal = blockPipTotal + blocksToCommit + shutoutContrib;

    const isGoal = attackTotal > blockTotal;

    // Commit blocks & resolve in the engine
    dispatch({ type: 'COMMIT_BLOCK_TOKENS', playerId: defenderId, amount: blocksToCommit });
    dispatch({ type: 'RESOLVE_WAVE', wave: currentWave, attackRolls, blockRolls });

    // Store result locally so we can show the panel before advancing
    setPendingResult({
      wave: currentWave,
      attackerName: attacker.name,
      defenderName: defender.name,
      attackPips: attacker.shootPipsTotal,
      attackTokens: attacker.shootTokensCommitted,
      attackRolls,
      attackTotal,
      blockPips: defender.blockPipsTotal + defender.goalieBlockPips,
      blockTokens: blocksToCommit,
      blockRolls,
      shutoutContrib,
      blockTotal,
      isGoal,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-slate-800/50 to-transparent pointer-events-none" />

      <div className="text-center mb-12 relative z-10">
        <h2 className="text-5xl font-display font-bold text-white uppercase tracking-widest drop-shadow-lg">
          Wave {currentWave}
        </h2>
        <p className="text-slate-400 text-lg uppercase tracking-widest mt-2">
          {attacker.name} is attacking
        </p>
      </div>

      <div className="flex-1 flex gap-12 max-w-6xl mx-auto w-full relative z-10">
        {/* Attacker Package */}
        <div className="flex-1 bg-slate-900 border-2 border-destructive/50 rounded-2xl p-8 flex flex-col shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 blur-3xl rounded-full" />
          <h3 className="text-2xl font-display font-bold text-destructive uppercase tracking-widest mb-8 border-b border-destructive/20 pb-4">
            Attack Package
          </h3>

          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold uppercase tracking-widest">Base Shoot Pips</span>
              <span className="text-3xl font-display font-bold text-white bg-slate-800 px-4 py-1 rounded-lg border border-slate-700">{attacker.shootPipsTotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold uppercase tracking-widest">Committed Tokens</span>
              <span className="text-3xl font-display font-bold text-yellow-400 bg-yellow-500/10 px-4 py-1 rounded-lg border border-yellow-500/30">+{attacker.shootTokensCommitted}</span>
            </div>

            <div className="mt-auto bg-slate-950 p-6 rounded-xl border border-destructive flex items-center justify-between">
              <span className="text-xl font-display font-bold text-white uppercase">Guaranteed</span>
              <span className="text-5xl font-display font-bold text-destructive">{baseAttack}</span>
            </div>
            <p className="text-center text-slate-500 text-sm italic">+ Combat Dice Roll Results</p>
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-800 border-4 border-slate-950 rounded-full flex items-center justify-center shadow-xl">
            <span className="font-display font-bold text-xl text-slate-500">VS</span>
          </div>
        </div>

        {/* Defender Actions */}
        <div className="flex-1 bg-slate-900 border-2 border-sky-500/50 rounded-2xl p-8 flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
          <h3 className="text-2xl font-display font-bold text-sky-400 uppercase tracking-widest mb-8 border-b border-sky-500/20 pb-4">
            Defense Response
          </h3>

          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold uppercase tracking-widest">Base Block Pips</span>
              <span className="text-3xl font-display font-bold text-white bg-slate-800 px-4 py-1 rounded-lg border border-slate-700">
                {defender.blockPipsTotal + defender.goalieBlockPips}
              </span>
            </div>
            {defender.goalieShutout && (
              <div className="bg-slate-200 text-slate-900 px-4 py-2 rounded font-bold uppercase tracking-widest text-center animate-pulse">
                Shutout Active (+5)
              </div>
            )}

            <div className="bg-slate-950 p-6 rounded-xl border border-sky-500/30">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-display font-bold text-sky-300 uppercase tracking-widest">Commit Block Tokens</span>
                <span className="text-3xl font-display font-bold text-sky-400">{blocksToCommit} / {defender.tokens.block}</span>
              </div>
              <Slider
                value={[blocksToCommit]}
                max={defender.tokens.block}
                step={1}
                onValueChange={(v) => setBlocksToCommit(v[0])}
                className="mb-2"
              />
            </div>

            <Button
              size="lg"
              className="mt-auto h-16 text-2xl font-display uppercase tracking-widest bg-sky-700 hover:bg-sky-600 text-white w-full shadow-[0_0_20px_rgba(56,189,248,0.4)]"
              onClick={handleResolveWave}
              data-testid="button-resolve-wave"
            >
              <Play className="w-6 h-6 mr-2" fill="currentColor" /> Resolve Wave
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
