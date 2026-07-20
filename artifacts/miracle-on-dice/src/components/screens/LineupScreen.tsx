import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { usePlayer } from '@/game/hooks';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '../game/CardDisplay';
import { LineupPosition, Card } from '@/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Slots in display order
const FORWARD_POSITIONS: LineupPosition[] = ['forward_1', 'forward_2', 'forward_3'];
const DEFENSE_POSITIONS: LineupPosition[] = ['defense_1', 'defense_2'];

export const LineupScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  // Derive active player from who has already confirmed — no stale state
  const [showScreen, setShowScreen] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean[]>([false, false]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Always 0 until player 0 confirms, then 1
  const activePlayer: 0 | 1 = confirmed[0] && !confirmed[1] ? 1 : 0;

  const player = usePlayer(activePlayer);

  if (!showScreen) {
    if (confirmed[0] && confirmed[1]) {
      dispatch({ type: 'REVEAL_LINEUPS' });
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

  const handleConfirm = () => {
    const newConfirmed = [...confirmed];
    newConfirmed[activePlayer] = true;
    setConfirmed(newConfirmed);
    setShowScreen(false);
    setSelectedCardId(null);
  };

  const handlePlaceCard = (card: Card, position: LineupPosition, faceDown: boolean) => {
    dispatch({ type: 'PLACE_CARD_IN_LINEUP', playerId: activePlayer, cardId: card.id, position, faceDown });
    setSelectedCardId(null);
  };

  const handleRemoveCard = (position: LineupPosition) => {
    dispatch({ type: 'REMOVE_CARD_FROM_LINEUP', playerId: activePlayer, position });
  };

  const handleSwapGoalie = (cardId: string) => {
    dispatch({ type: 'SWAP_GOALIE', playerId: activePlayer, newGoalieCardId: cardId });
    setSelectedCardId(null);
  };

  const isFull = player.lineup.every(slot => slot.card !== null);

  // Detect duplicate tier warning
  const faceUpTiers = player.lineup
    .filter(s => !s.faceDown && s.card && s.card.tier > 0 && s.card.category !== 'penalty')
    .map(s => s.card!.tier);
  const hasDuplicates = faceUpTiers.filter((t, i) => faceUpTiers.indexOf(t) !== i).length > 0;

  // Helper: which positions in a set are still empty?
  const emptyPositions = (positions: LineupPosition[]) =>
    positions.filter(pos => !player.lineup.find(s => s.position === pos)?.card);

  // Build action panel options for the selected card
  const selectedCard = selectedCardId ? player.hand.find(c => c.id === selectedCardId) ?? null : null;

  const buildActions = (card: Card) => {
    const emptyForwards = emptyPositions(FORWARD_POSITIONS);
    const emptyDefense = emptyPositions(DEFENSE_POSITIONS);
    const anyEmpty = emptyPositions([...FORWARD_POSITIONS, ...DEFENSE_POSITIONS]);

    switch (card.category) {
      case 'forward':
        return {
          naturalSlots: emptyForwards,
          rookieSlots: emptyForwards.length === 0 ? anyEmpty : [], // offer rookie only when locked out
          label: 'Forward slot',
          canFaceDown: emptyForwards.length === 0 && anyEmpty.length > 0,
        };
      case 'defenseman':
        return {
          naturalSlots: emptyDefense,
          rookieSlots: emptyDefense.length === 0 ? anyEmpty : [],
          label: 'Defense slot',
          canFaceDown: emptyDefense.length === 0 && anyEmpty.length > 0,
        };
      case 'rookie':
        // Rookies always go face-down — show a single "Place as Rookie" button
        return {
          naturalSlots: [],
          rookieSlots: anyEmpty,
          label: 'Rookie slot',
          canFaceDown: false, // handled by rookieSlots path
        };
      default:
        return { naturalSlots: [], rookieSlots: anyEmpty, label: 'Slot', canFaceDown: false };
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-950 relative">
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant={isFull ? 'default' : 'secondary'}
          size="lg"
          className={cn('font-display text-xl', isFull && 'bg-green-600 hover:bg-green-500 text-white')}
          onClick={handleConfirm}
          disabled={!isFull}
          data-testid="button-confirm-lineup"
        >
          {isFull ? 'Confirm Lineup' : 'Lineup Incomplete'}
        </Button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-display font-bold text-white">{player.name}'s Bench</h2>
        <p className="text-slate-400">Tap a card, then pick an open slot.</p>
        {hasDuplicates && (
          <Badge variant="destructive" className="mt-2 text-sm px-3 py-1 font-bold animate-pulse">
            <AlertCircle className="w-4 h-4 mr-2" />
            Duplicate Tier Warning! You will gain a Penalty.
          </Badge>
        )}
      </div>

      {/* RINK LAYOUT */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 relative">
        <div className="w-[800px] h-[400px] bg-slate-900 border-4 border-slate-700 rounded-[100px] relative overflow-hidden flex flex-col justify-between pt-6 px-8 pb-0 box-glow-blue shadow-2xl">
          {/* Ice markings */}
          <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-red-500/20 -translate-x-1/2 z-0" />
          <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-red-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 z-0" />

          <div className="flex justify-around relative z-10 w-full">
            {FORWARD_POSITIONS.map(pos => (
              <LineupSlotUI key={pos} position={pos} player={player} onRemove={() => handleRemoveCard(pos)} />
            ))}
          </div>

          {/* Defense slots shifted left to leave centre-right clear for goalie crease */}
          <div className="flex justify-center gap-24 relative z-10 w-full -translate-x-16 mb-2">
            {DEFENSE_POSITIONS.map(pos => (
              <LineupSlotUI key={pos} position={pos} player={player} onRemove={() => handleRemoveCard(pos)} />
            ))}
          </div>
        </div>

        {/* Goalie Area — sits below the rink, centred */}
        <div className="mt-3 flex flex-col items-center relative">
          <div className="bg-red-500/20 w-48 h-10 rounded-t-full border-t-2 border-red-500/50 absolute top-0 left-1/2 -translate-x-1/2 -z-10" />
          <div className="z-10 bg-slate-900 border-2 border-slate-700 p-2 rounded-xl scale-75 origin-top shadow-xl">
            <CardDisplay card={player.goalie!} />
          </div>
        </div>
      </div>

      {/* HAND */}
      <div className="bg-slate-900/80 border-t-2 border-slate-800 p-4 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-400 font-display uppercase tracking-widest text-sm">
            Your Hand — <span className="text-slate-500 normal-case font-sans font-normal text-xs">tap a card to select it</span>
          </h3>
          {selectedCardId && (
            <button onClick={() => setSelectedCardId(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action panel — shown when a card is selected */}
        <AnimatePresence>
          {selectedCard && (() => {
            const { naturalSlots, rookieSlots, label, canFaceDown } = buildActions(selectedCard);

            return (
              <motion.div
                key="action-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-3 flex flex-wrap items-center gap-2">
                  <span className="text-white font-bold text-sm mr-2">{selectedCard.name}</span>

                  {/* Goalie swap */}
                  {selectedCard.category === 'goalie' && (
                    <Button size="sm" variant="secondary" onClick={() => handleSwapGoalie(selectedCard.id)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Swap Goalie
                    </Button>
                  )}

                  {/* Natural position slots (only empty ones) */}
                  {naturalSlots.length > 0 && (
                    <>
                      <span className="text-slate-500 text-xs uppercase tracking-wide">{label}:</span>
                      {naturalSlots.map(pos => (
                        <Button
                          key={pos}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs border-sky-600 text-sky-300 hover:bg-sky-700/30"
                          onClick={() => handlePlaceCard(selectedCard, pos, false)}
                        >
                          {pos.replace('_', ' ').replace('forward', 'F').replace('defense', 'D')}
                        </Button>
                      ))}
                    </>
                  )}

                  {/* No natural slot available — offer to play face-down as rookie */}
                  {naturalSlots.length === 0 && canFaceDown && (
                    <span className="text-amber-400 text-xs italic">
                      No open {label.toLowerCase()}s —
                    </span>
                  )}

                  {/* Rookie: each empty slot shown face-down */}
                  {selectedCard.category === 'rookie' && rookieSlots.length > 0 && (
                    <>
                      <span className="text-slate-500 text-xs uppercase tracking-wide">Place face-down at:</span>
                      {rookieSlots.map(pos => (
                        <Button
                          key={pos}
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 text-xs bg-slate-700 text-slate-200 hover:bg-slate-600"
                          onClick={() => handlePlaceCard(selectedCard, pos, true)}
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                          {pos.replace('_', ' ').replace('forward', 'F').replace('defense', 'D')}
                        </Button>
                      ))}
                    </>
                  )}

                  {/* Non-rookie face-down (locked out of natural slot) */}
                  {selectedCard.category !== 'rookie' && (canFaceDown || (naturalSlots.length === 0 && rookieSlots.length > 0)) && rookieSlots.length > 0 && (
                    <>
                      <span className="text-slate-500 text-xs uppercase tracking-wide">As rookie (face-down):</span>
                      {rookieSlots.map(pos => (
                        <Button
                          key={pos}
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 text-xs bg-slate-700 text-slate-200 hover:bg-slate-600"
                          onClick={() => handlePlaceCard(selectedCard, pos, true)}
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                          {pos.replace('_', ' ').replace('forward', 'F').replace('defense', 'D')}
                        </Button>
                      ))}
                    </>
                  )}

                  {/* Penalty */}
                  {selectedCard.category === 'penalty' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const empty = player.lineup.find(s => !s.card);
                        if (empty) handlePlaceCard(selectedCard, empty.position, false);
                      }}
                    >
                      Place Penalty
                    </Button>
                  )}

                  {/* Nothing available at all */}
                  {naturalSlots.length === 0 && rookieSlots.length === 0 && selectedCard.category !== 'goalie' && selectedCard.category !== 'penalty' && (
                    <span className="text-red-400 text-xs italic">Lineup is full — remove a card first</span>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Card row */}
        <div className="flex gap-3 overflow-x-auto pb-3 px-1">
          <AnimatePresence>
            {player.hand.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="shrink-0 cursor-pointer"
                onClick={() => setSelectedCardId(id => id === card.id ? null : card.id)}
              >
                <CardDisplay
                  card={card}
                  selected={selectedCardId === card.id}
                  className={cn(
                    'transition-transform duration-150',
                    selectedCardId === card.id ? '-translate-y-3 ring-4 ring-primary' : 'hover:-translate-y-1',
                    selectedCardId && selectedCardId !== card.id ? 'opacity-50' : ''
                  )}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {player.hand.length === 0 && (
            <div className="w-full text-center text-slate-500 italic py-10">Hand is empty</div>
          )}
        </div>
      </div>
    </div>
  );
};

const LineupSlotUI = ({ position, player, onRemove }: { position: LineupPosition; player: any; onRemove: () => void }) => {
  const slot = player.lineup.find((s: any) => s.position === position);

  if (!slot?.card) {
    return (
      <div className="w-32 h-44 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center bg-slate-800/50">
        <span className="text-slate-500 font-display text-xl uppercase tracking-widest opacity-50">
          {position.replace('_', ' ')}
        </span>
      </div>
    );
  }

  return (
    <div className="relative group w-32 h-44">
      <div className="absolute -top-3 -right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="destructive" size="icon" className="w-8 h-8 rounded-full shadow-lg" onClick={onRemove}>
          ✕
        </Button>
      </div>
      <div className="scale-75 origin-top-left absolute top-0 left-0 w-48">
        <CardDisplay card={slot.card} faceDown={slot.faceDown} />
      </div>
    </div>
  );
};

const ShieldScreen = ({ playerName, onReady }: { playerName: string; onReady: () => void }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="bg-slate-900 border-2 border-slate-700 p-12 rounded-3xl shadow-2xl text-center max-w-lg"
  >
    <EyeOff className="w-24 h-24 text-slate-500 mx-auto mb-6" />
    <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-widest">Hidden Phase</h2>
    <p className="text-xl text-primary mb-8">Pass device to <strong className="text-white">{playerName}</strong></p>
    <Button
      size="lg"
      onClick={onReady}
      className="w-full h-16 text-xl font-display uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground"
      data-testid="button-im-ready"
    >
      I'm Ready
    </Button>
  </motion.div>
);
