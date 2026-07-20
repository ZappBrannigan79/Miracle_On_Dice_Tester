import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { usePlayer } from '@/game/hooks';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '../game/CardDisplay';
import { TokenDisplay } from '../game/TokenDisplay';
import { Coins, LogOut, ArrowLeftRight, X } from 'lucide-react';
import { tradeCost, Card } from '@/game/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Trade modal ──────────────────────────────────────────────────────────────

interface TradeTarget {
  slotId: string;
  card: Card;
}

const TradeModal: React.FC<{
  target: TradeTarget;
  activePid: 0 | 1;
  onClose: () => void;
}> = ({ target, activePid, onClose }) => {
  const { state, dispatch } = useGame();
  const player = usePlayer(activePid);
  const [selectedTrashId, setSelectedTrashId] = useState<string | null>(null);
  const cost = tradeCost(target.card);
  const canAfford = player.tokens.energy >= cost;

  // Board = cards currently placed in the lineup slots (the "hand" during buy phase)
  const boardCards = player.lineup
    .filter(slot => slot.card !== null)
    .map(slot => ({ ...slot.card!, _source: `board (${slot.position.replace('_', ' ')})` as const }));

  const tradeable = [
    ...boardCards,
    ...player.discard.map(c => ({ ...c, _source: 'discard' as const })),
  ].filter(c => c.category !== 'penalty');

  const handleConfirm = () => {
    if (!selectedTrashId || !canAfford) return;
    dispatch({ type: 'TRADE_CARD', playerId: activePid, marketSlotId: target.slotId, trashCardId: selectedTrashId });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-slate-900 border-2 border-slate-600 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-950">
          <div className="flex items-center gap-4">
            <ArrowLeftRight className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-display font-bold text-white text-xl uppercase tracking-widest">
                Trade for {target.card.name}
              </h3>
              <p className="text-slate-400 text-sm">
                Costs <span className="text-yellow-400 font-bold">{cost}⚡</span> — trash one card from your hand or discard pile.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-6 p-6">
          {/* Target card preview */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">You receive</p>
            <CardDisplay card={target.card} />
            <div className={cn(
              'text-sm font-bold px-3 py-1 rounded-lg',
              canAfford ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10',
            )}>
              {canAfford ? `${cost}⚡ available` : `Need ${cost}⚡ (have ${player.tokens.energy})`}
            </div>
          </div>

          {/* Trash selector */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">
              Select card to trash ({tradeable.length} available)
            </p>
            {tradeable.length === 0 ? (
              <div className="text-slate-500 italic text-sm py-6 text-center">
                No tradeable cards in hand or discard.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 max-h-72 overflow-y-auto pr-1">
                {tradeable.map(card => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedTrashId(id => id === card.id ? null : card.id)}
                    className={cn(
                      'cursor-pointer transition-all duration-150',
                      selectedTrashId === card.id
                        ? '-translate-y-1 ring-2 ring-red-400 rounded-xl'
                        : 'opacity-70 hover:opacity-100',
                    )}
                  >
                    <CardDisplay card={card} compact />
                    <div className="text-center mt-1">
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                        card._source === 'hand'
                          ? 'text-sky-400 bg-sky-400/10'
                          : 'text-slate-400 bg-slate-700',
                      )}>
                        {card._source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-950">
          <Button variant="outline" onClick={onClose} className="border-slate-600">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTrashId || !canAfford}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold disabled:opacity-40"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Confirm Trade ({cost}⚡)
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const BuyPhaseScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const activePid = state.buyPhaseActivePlayer ?? 0;
  const player = usePlayer(activePid);
  const [tradeTarget, setTradeTarget] = useState<TradeTarget | null>(null);

  const handleDraft = (marketSlotId: string, cost: number) => {
    if (player.tokens.energy >= cost)
      dispatch({ type: 'DRAFT_CARD', playerId: activePid, marketSlotId });
  };

  const handleScout = (marketSlotId: string) => {
    if (player.tokens.energy >= 2)
      dispatch({ type: 'SCOUT_CARD', playerId: activePid, marketSlotId });
  };

  const handleBuyToken = (tokenType: 'shoot' | 'block') => {
    if (player.tokens.energy >= 5)
      dispatch({ type: 'BUY_TOKEN', playerId: activePid, tokenType });
  };

  const handleEndTurn = () => dispatch({ type: 'END_BUY_PHASE', playerId: activePid });

  return (
    <>
      <AnimatePresence>
        {tradeTarget && (
          <TradeModal
            target={tradeTarget}
            activePid={activePid}
            onClose={() => setTradeTarget(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col p-6 bg-slate-950 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl relative z-10 backdrop-blur-md">
          <div>
            <h2 className="text-4xl font-display font-bold text-white uppercase tracking-widest mb-1">
              {player.name}'s Front Office
            </h2>
            <p className="text-slate-400">Draft, trade, or scout the market to build your deck.</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="bg-slate-950 px-6 py-3 rounded-xl border border-yellow-500/30 flex items-center gap-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Energy</span>
              <TokenDisplay type="energy" count={player.tokens.energy} size="lg" />
            </div>

            <Button
              size="lg"
              variant="outline"
              className="h-14 font-display text-xl uppercase tracking-widest border-slate-600 hover:bg-slate-800 hover:text-white"
              onClick={handleEndTurn}
              data-testid="button-end-buy-phase"
            >
              End Shopping <LogOut className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Market grid */}
        <div className="flex-1 grid grid-cols-6 gap-4 relative z-10">
          {state.marketSlots.map(slot => (
            <div key={slot.id} className="flex flex-col items-center">
              {slot.card ? (
                <>
                  <CardDisplay card={slot.card} className="w-full h-auto aspect-[3/4] mb-3 shadow-lg" />
                  <div className="flex flex-col w-full gap-2 px-1">
                    {/* Draft */}
                    <Button
                      size="sm"
                      className="w-full bg-sky-600 hover:bg-sky-500 font-bold text-xs"
                      disabled={player.tokens.energy < slot.card.cost}
                      onClick={() => handleDraft(slot.id, slot.card!.cost)}
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      Draft ({slot.card.cost}⚡)
                    </Button>
                    {/* Trade */}
                    <Button
                      size="sm"
                      className="w-full bg-amber-600 hover:bg-amber-500 font-bold text-xs"
                      disabled={player.tokens.energy < tradeCost(slot.card)}
                      onClick={() => setTradeTarget({ slotId: slot.id, card: slot.card! })}
                    >
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      Trade ({tradeCost(slot.card)}⚡)
                    </Button>
                    {/* Scout */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-slate-600 hover:bg-slate-800 text-xs"
                      disabled={player.tokens.energy < 2}
                      onClick={() => handleScout(slot.id)}
                    >
                      Scout (2⚡)
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full aspect-[3/4] border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-900/50 mb-3">
                  <span className="text-slate-600 font-display font-bold tracking-widest uppercase">Empty</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Buy tokens row */}
        <div className="mt-6 flex justify-center gap-6 relative z-10">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
            <span className="text-slate-300 font-bold uppercase tracking-widest text-sm">
              Buy Tokens (5⚡ each)
            </span>
            <Button
              variant="outline"
              className="border-sky-500/50 hover:bg-sky-500/10 text-sky-400"
              disabled={player.tokens.energy < 5}
              onClick={() => handleBuyToken('shoot')}
            >
              +1 Shoot
            </Button>
            <Button
              variant="outline"
              className="border-red-500/50 hover:bg-red-500/10 text-red-400"
              disabled={player.tokens.energy < 5}
              onClick={() => handleBuyToken('block')}
            >
              +1 Block
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
