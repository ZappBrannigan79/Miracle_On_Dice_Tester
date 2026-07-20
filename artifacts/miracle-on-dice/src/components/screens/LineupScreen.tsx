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

  const [showScreen, setShowScreen] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean[]>([false, false]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

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

  // Drag & Drop Handlers
  const handleDragStartCard = (e: React.DragEvent, card: Card, fromSlot?: LineupPosition) => {
    e.dataTransfer.setData('text/plain', card.id);
    if (fromSlot) {
      e.dataTransfer.setData('fromSlot', fromSlot);
    }
    setDraggingCardId(card.id);
  };

  const handleDragEndCard = () => {
    setDraggingCardId(null);
    setActiveDropZone(null);
  };

  const handleDropOnSlot = (e: React.DragEvent, position: LineupPosition) => {
    e.preventDefault();
    setActiveDropZone(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    const card = player.hand.find(c => c.id === cardId);
    if (!card) return;

    const isForwardSlot = FORWARD_POSITIONS.includes(position);
    const isDefenseSlot = DEFENSE_POSITIONS.includes(position);

    let faceDown = false;

    // Out-of-position veterans play face-down as makeshift rookies.
    // Dedicated Rookie cards can play anywhere face-up!
    if (card.category === 'forward' && !isForwardSlot) {
      faceDown = true;
    } else if (card.category === 'defenseman' && !isDefenseSlot) {
      faceDown = true;
    }

    handlePlaceCard(card, position, faceDown);
  };

  const handleDropOnGoalie = (e: React.DragEvent) => {
    e.preventDefault();
    setActiveDropZone(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    const card = player.hand.find(c => c.id === cardId);
    if (card && card.category === 'goalie') {
      handleSwapGoalie(card.id);
    }
  };

  const handleDropOnHand = (e: React.DragEvent) => {
    e.preventDefault();
    setActiveDropZone(null);
    const fromSlot = e.dataTransfer.getData('fromSlot') as LineupPosition;
    if (fromSlot) {
      handleRemoveCard(fromSlot);
    }
  };

  const isFull = player.lineup.every(slot => slot.card !== null);

  const faceUpTiers = player.lineup
    .filter(s => !s.faceDown && s.card && s.card.tier > 0 && s.card.category !== 'penalty')
    .map(s => s.card!.tier);
  const hasDuplicates = faceUpTiers.filter((t, i) => faceUpTiers.indexOf(t) !== i).length > 0;

  const emptyPositions = (positions: LineupPosition[]) =>
    positions.filter(pos => !player.lineup.find(s => s.position === pos)?.card);

  const selectedCard = selectedCardId ? player.hand.find(c => c.id === selectedCardId) ?? null : null;

  const buildActions = (card: Card) => {
    const emptyForwards = emptyPositions(FORWARD_POSITIONS);
    const emptyDefense = emptyPositions(DEFENSE_POSITIONS);
    const anyEmpty = emptyPositions([...FORWARD_POSITIONS, ...DEFENSE_POSITIONS]);

    switch (card.category) {
      case 'forward':
        return {
          naturalSlots: emptyForwards,
          rookieSlots: emptyForwards.length === 0 ? anyEmpty : [],
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
        return {
          naturalSlots: anyEmpty,
          rookieSlots: [],
          label: 'Slot',
          canFaceDown: false,
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
        <p className="text-slate-400">Drag a card into an open slot, or tap to select.</p>
        {hasDuplicates && (
          <Badge variant="destructive" className="mt-2 text-sm px-3 py-1 font-bold animate-pulse">
            <AlertCircle className="w-4 h-4 mr-2" />
            Duplicate Tier Warning! You will gain a Penalty.
          </Badge>
        )}
      </div>

      {/* RINK LAYOUT */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 relative">
        <div className="w-[850px] h-[480px] bg-slate-900 border-4 border-slate-700 rounded-[80px] relative overflow-hidden flex flex-col justify-around py-6 px-10 box-glow-blue shadow-2xl">
          <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-red-500/20 -translate-x-1/2 z-0" />
          <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-red-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 z-0" />

          {/* Top Row: Forwards */}
          <div className="flex justify-between relative z-10 w-full px-4">
            {FORWARD_POSITIONS.map(pos => (
              <LineupSlotUI
                key={pos}
                position={pos}
                player={player}
                onRemove={() => handleRemoveCard(pos)}
                isDragging={!!draggingCardId}
                isActiveDrop={activeDropZone === pos}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (activeDropZone !== pos) setActiveDropZone(pos);
                }}
                onDragLeave={() => setActiveDropZone(null)}
                onDrop={(e) => handleDropOnSlot(e, pos)}
                onDragStartCard={(e, card) => handleDragStartCard(e, card, pos)}
                onDragEndCard={handleDragEndCard}
              />
            ))}
          </div>

          {/* Bottom Row: Defense 1, Defense 2, Goalie */}
          <div className="flex justify-between items-center relative z-10 w-full px-4">
            {DEFENSE_POSITIONS.map(pos => (
              <LineupSlotUI
                key={pos}
                position={pos}
                player={player}
                onRemove={() => handleRemoveCard(pos)}
                isDragging={!!draggingCardId}
                isActiveDrop={activeDropZone === pos}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (activeDropZone !== pos) setActiveDropZone(pos);
                }}
                onDragLeave={() => setActiveDropZone(null)}
                onDrop={(e) => handleDropOnSlot(e, pos)}
                onDragStartCard={(e, card) => handleDragStartCard(e, card, pos)}
                onDragEndCard={handleDragEndCard}
              />
            ))}

            {/* Goalie Area */}
            <div
              className={cn(
                'relative group w-32 h-44 flex items-center justify-center transition-all rounded-xl',
                draggingCardId && 'border-2 border-dashed border-sky-400/50 bg-sky-950/20',
                activeDropZone === 'goalie' && 'border-sky-400 bg-sky-500/20 scale-105'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                if (activeDropZone !== 'goalie') setActiveDropZone('goalie');
              }}
              onDragLeave={() => setActiveDropZone(null)}
              onDrop={handleDropOnGoalie}
            >
              <div className="bg-red-500/20 w-36 h-8 rounded-t-full border-t-2 border-red-500/50 absolute top-0 left-1/2 -translate-x-1/2 z-0" />
              <div className="z-10 scale-75 origin-top absolute top-0 left-0 w-48">
                {player.goalie && <CardDisplay card={player.goalie} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HAND / BENCH */}
      <div
        className={cn(
          'bg-slate-900/80 border-t-2 border-slate-800 p-4 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors',
          activeDropZone === 'hand' && 'border-sky-500 bg-slate-900'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (activeDropZone !== 'hand') setActiveDropZone('hand');
        }}
        onDragLeave={() => setActiveDropZone(null)}
        onDrop={handleDropOnHand}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-400 font-display uppercase tracking-widest text-sm">
            Your Hand — <span className="text-slate-500 normal-case font-sans font-normal text-xs">drag to a slot or tap to select</span>
          </h3>
          {selectedCardId && (
            <button onClick={() => setSelectedCardId(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

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

                  {selectedCard.category === 'goalie' && (
                    <Button size="sm" variant="secondary" onClick={() => handleSwapGoalie(selectedCard.id)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Swap Goalie
                    </Button>
                  )}

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

                  {naturalSlots.length === 0 && canFaceDown && (
                    <span className="text-amber-400 text-xs italic">
                      No open {label.toLowerCase()}s —
                    </span>
                  )}

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

                  {naturalSlots.length === 0 && rookieSlots.length === 0 && selectedCard.category !== 'goalie' && selectedCard.category !== 'penalty' && (
                    <span className="text-red-400 text-xs italic">Lineup is full — remove a card first</span>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Card Row */}
        <div className="flex gap-3 overflow-x-auto pb-3 px-1">
          <AnimatePresence>
            {player.hand.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn('shrink-0 cursor-grab active:cursor-grabbing')}
                draggable
                onDragStart={(e) => handleDragStartCard(e as any, card)}
                onDragEnd={handleDragEndCard}
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

interface LineupSlotUIProps {
  position: LineupPosition;
  player: any;
  onRemove: () => void;
  isDragging: boolean;
  isActiveDrop: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStartCard: (e: React.DragEvent, card: Card) => void;
  onDragEndCard: () => void;
}

const LineupSlotUI: React.FC<LineupSlotUIProps> = ({
  position,
  player,
  onRemove,
  isDragging,
  isActiveDrop,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStartCard,
  onDragEndCard,
}) => {
  const slot = player.lineup.find((s: any) => s.position === position);

  if (!slot?.card) {
    return (
      <div
        className={cn(
          'w-32 h-44 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center bg-slate-800/50 transition-all',
          isDragging && 'border-sky-400/60 bg-sky-950/20 shadow-lg',
          isActiveDrop && 'border-sky-400 bg-sky-500/30 scale-105 shadow-sky-500/20'
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="text-slate-500 font-display text-xl uppercase tracking-widest opacity-50 text-center px-1">
          {position.replace('_', ' ')}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative group w-32 h-44 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStartCard(e, slot.card)}
      onDragEnd={onDragEndCard}
    >
      <div className="absolute -top-3 -right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="destructive" size="icon" className="w-8 h-8 rounded-full shadow-lg" onClick={onRemove}>
          ✕
        </Button>
      </div>
      <div className="scale-75 origin-top-left absolute top-0 left-0 w-48 pointer-events-none">
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
