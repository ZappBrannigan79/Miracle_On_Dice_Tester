import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { usePlayer } from '@/game/hooks';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, Zap, EyeOff } from 'lucide-react';
import { DieDisplay } from '../game/DieDisplay';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { RolledDie } from '@/game/types';

// ─── zone helpers ────────────────────────────────────────────────────────────

const ZONE_META = {
  energy: {
    title: 'Energy Zone',
    Icon: Zap,
    iconCls: 'text-yellow-400',
    border: 'border-yellow-500/60',
    bg: 'bg-yellow-500/5',
    text: 'text-yellow-300',
    labelBg: 'bg-yellow-500/10',
    totalCls: 'text-yellow-300',
  },
  shoot: {
    title: 'Shoot Zone',
    Icon: Target,
    iconCls: 'text-sky-400',
    border: 'border-sky-500/60',
    bg: 'bg-sky-500/5',
    text: 'text-sky-300',
    labelBg: 'bg-sky-500/10',
    totalCls: 'text-sky-300',
  },
  block: {
    title: 'Block Zone',
    Icon: Shield,
    iconCls: 'text-red-400',
    border: 'border-red-500/60',
    bg: 'bg-red-500/5',
    text: 'text-red-300',
    labelBg: 'bg-red-500/10',
    totalCls: 'text-red-300',
  },
} as const;

type ZoneKey = keyof typeof ZONE_META;

const diceInZone = (dice: RolledDie[], zone: ZoneKey) =>
  dice.filter(d =>
    d.face.type === 'wild'
      ? d.wildAssignedAs === zone
      : d.zone === zone || (zone === 'block' && d.isGoalie),
  );

const pipTotal = (dice: RolledDie[]) =>
  dice.reduce((sum, d) => sum + (d.face.value ?? 0), 0);

// ─── component ───────────────────────────────────────────────────────────────

export const RollAssignScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  const [showScreen, setShowScreen] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean[]>([false, false]);
  const [rerolled, setRerolled] = useState(false);
  const [selectedForReroll, setSelectedForReroll] = useState<string[]>([]);

  // Derive active player — never call setState during render
  const activePlayer: 0 | 1 = confirmed[0] && !confirmed[1] ? 1 : 0;
  const player = usePlayer(activePlayer);
  const hasRolled = player.rolledDice.length > 0;

  if (!showScreen) {
    if (confirmed[0] && confirmed[1]) {
      dispatch({ type: 'CONFIRM_ROLL_ASSIGN', playerId: 0 });
      return null;
    }

    const nextPlayer: 0 | 1 = confirmed[0] ? 1 : 0;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950">
        <ShieldScreen
          playerName={state.players[nextPlayer].name}
          onReady={() => setShowScreen(true)}
        />
      </div>
    );
  }

  const handleRoll = () => dispatch({ type: 'ROLL_DICE', playerId: activePlayer });

  const handleToggleReroll = (dieId: string) => {
    if (rerolled) return;
    setSelectedForReroll(prev =>
      prev.includes(dieId) ? prev.filter(id => id !== dieId) : [...prev, dieId],
    );
  };

  const handleExecuteReroll = () => {
    if (selectedForReroll.length > 0 && !rerolled) {
      dispatch({ type: 'REROLL_DICE', playerId: activePlayer, dieIds: selectedForReroll });
      setRerolled(true);
      setSelectedForReroll([]);
    }
  };

  const handleAssignWild = (dieId: string, zone: ZoneKey) =>
    dispatch({ type: 'ASSIGN_WILD', playerId: activePlayer, dieId, assignTo: zone });

  const handleConfirm = () => {
    const newConfirmed = [...confirmed];
    newConfirmed[activePlayer] = true;
    setConfirmed(newConfirmed);
    setShowScreen(false);
    setRerolled(false);
    setSelectedForReroll([]);
  };

  const wildsUnassigned = player.rolledDice.some(
    d => d.face.type === 'wild' && !d.wildAssignedAs,
  );

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-950">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">{player.name}'s Rolls</h2>
          <p className="text-slate-400">Roll dice, reroll once, assign wilds, commit tokens.</p>
        </div>
        {hasRolled && (
          <Button
            variant="default"
            size="lg"
            className="font-display text-xl bg-green-600 hover:bg-green-500"
            onClick={handleConfirm}
            disabled={wildsUnassigned}
            data-testid="button-confirm-rolls"
          >
            Confirm & End Turn
          </Button>
        )}
      </div>

      {!hasRolled ? (
        <div className="flex-1 flex items-center justify-center">
          <Button
            size="lg"
            className="h-24 px-16 text-3xl font-display uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(56,189,248,0.5)] hover:scale-105 transition-transform"
            onClick={handleRoll}
            data-testid="button-roll-dice"
          >
            Roll Dice
          </Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-6">
          {/* DICE POOL */}
          <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl uppercase tracking-widest text-slate-300">
                Rolled Dice
              </h3>
              {!rerolled && selectedForReroll.length > 0 && (
                <Button
                  onClick={handleExecuteReroll}
                  variant="secondary"
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  Reroll Selected ({selectedForReroll.length})
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-6 min-h-24">
              <AnimatePresence>
                {player.rolledDice.map(die => (
                  <div key={die.id} className="relative group flex flex-col items-center">
                    <DieDisplay
                      die={die}
                      onClick={() => handleToggleReroll(die.id)}
                      selectable={!rerolled && die.face.type !== 'shutout'}
                      selected={selectedForReroll.includes(die.id)}
                      animateRoll={true}
                    />

                    {/* Wild assignment buttons — always visible if unassigned, hover if assigned */}
                    {die.face.type === 'wild' && !selectedForReroll.includes(die.id) && (
                      <div className={cn(
                        'mt-2 bg-slate-800 border border-slate-600 rounded-lg p-1 flex gap-1 z-20 transition-opacity',
                        die.wildAssignedAs ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
                      )}>
                        <button
                          onClick={() => handleAssignWild(die.id, 'energy')}
                          className="w-8 h-8 rounded hover:bg-yellow-900/50 flex items-center justify-center"
                          title="Assign to Energy"
                        >
                          <Zap className="w-4 h-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => handleAssignWild(die.id, 'shoot')}
                          className="w-8 h-8 rounded hover:bg-sky-900/50 flex items-center justify-center"
                          title="Assign to Shoot"
                        >
                          <Target className="w-4 h-4 text-sky-400" />
                        </button>
                        <button
                          onClick={() => handleAssignWild(die.id, 'block')}
                          className="w-8 h-8 rounded hover:bg-red-900/50 flex items-center justify-center"
                          title="Assign to Block"
                        >
                          <Shield className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex gap-6 flex-1">
            {/* MAT ZONES */}
            <div className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-xl p-6 shadow-xl flex flex-col">
              <h3 className="font-display text-xl uppercase tracking-widest text-slate-300 mb-4">
                Mat Zones
              </h3>

              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {(['energy', 'shoot', 'block'] as ZoneKey[]).map(zone => {
                  const meta = ZONE_META[zone];
                  const zoneDice = diceInZone(player.rolledDice, zone);
                  const total = pipTotal(zoneDice);
                  return (
                    <ZoneRow
                      key={zone}
                      meta={meta}
                      total={total}
                    >
                      {zoneDice.map(d => (
                        <DieDisplay key={`z-${d.id}`} die={d} size="sm" />
                      ))}
                    </ZoneRow>
                  );
                })}
              </div>
            </div>

            {/* SHOOT TOKENS COMMIT */}
            <div className="w-1/3 bg-slate-900 border-2 border-sky-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(56,189,248,0.1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sky-400">
                  <Target className="w-6 h-6" />
                  <h3 className="font-display text-xl uppercase tracking-widest">Commit Tokens</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">
                  Commit Shoot tokens now to add to your attack. Uncommitted tokens cannot be used
                  offensively this shift.
                </p>

                <div className="text-center mb-8">
                  <div className="text-6xl font-display font-bold text-sky-400 mb-2">
                    {player.shootTokensCommitted}
                  </div>
                  <div className="text-sm uppercase tracking-widest text-sky-600">Committed</div>
                </div>

                <Slider
                  value={[player.shootTokensCommitted]}
                  max={player.tokens.shoot}
                  step={1}
                  onValueChange={val =>
                    dispatch({
                      type: 'COMMIT_SHOOT_TOKENS',
                      playerId: activePlayer,
                      amount: val[0],
                    })
                  }
                  className="mb-4"
                />
                <div className="flex justify-between text-xs text-slate-500 font-bold">
                  <span>0</span>
                  <span>Max: {player.tokens.shoot}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ZoneRow ─────────────────────────────────────────────────────────────────

type ZoneMeta = typeof ZONE_META[ZoneKey];

const ZoneRow = ({
  meta,
  total,
  children,
}: {
  meta: ZoneMeta;
  total: number;
  children: React.ReactNode;
}) => {
  const { Icon, iconCls, border, bg, text, labelBg, totalCls, title } = meta;
  return (
    <div className={cn('flex border-2 rounded-xl overflow-hidden items-stretch min-h-[5rem]', border, bg)}>
      {/* Label column */}
      <div className={cn('w-36 px-3 py-2 border-r-2 flex flex-col justify-center gap-1 border-inherit', labelBg)}>
        <div className={cn('flex items-center gap-1.5 font-display uppercase font-bold tracking-wider text-xs', text)}>
          <Icon className={cn('w-3.5 h-3.5 shrink-0', iconCls)} />
          {title}
        </div>
        {/* Pip total */}
        <div className="flex items-baseline gap-1">
          <span className={cn('text-2xl font-display font-black leading-none', totalCls)}>
            {total}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">pips</span>
        </div>
      </div>

      {/* Dice area */}
      <div className="flex-1 px-4 flex items-center gap-3 overflow-x-auto py-2">
        {children}
        {total === 0 && (
          <span className="text-slate-600 text-xs italic">No dice yet</span>
        )}
      </div>
    </div>
  );
};

// ─── ShieldScreen ─────────────────────────────────────────────────────────────

const ShieldScreen = ({ playerName, onReady }: { playerName: string; onReady: () => void }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="bg-slate-900 border-2 border-slate-700 p-12 rounded-3xl shadow-2xl text-center max-w-lg"
  >
    <EyeOff className="w-24 h-24 text-slate-500 mx-auto mb-6" />
    <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">
      Rolling Phase
    </h2>
    <p className="text-xl text-primary mb-8">
      Pass device to <strong className="text-white">{playerName}</strong>
    </p>
    <Button
      size="lg"
      onClick={onReady}
      className="w-full h-16 text-xl font-display uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground"
      data-testid="button-im-ready-roll"
    >
      I'm Ready To Roll
    </Button>
  </motion.div>
);
