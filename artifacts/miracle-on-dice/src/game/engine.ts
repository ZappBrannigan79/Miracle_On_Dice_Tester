// ============================================================
// MIRACLE ON DICE — Game Engine (State Reducer)
// ============================================================

import type {
  GameState,
  GameAction,
  PlayerState,
  LineupSlot,
  LineupPosition,
  Tokens,
  MarketSlot,
  PeriodState,
  RolledDie,
  LogEntry,
} from './types';
import {
  TOKEN_CAPS,
  GOAL_ENERGY_BONUS,
  SCOUTING_COST,
  TOKEN_PURCHASE_COST,
  tradeCost,
} from './types';
import {
  ALL_MARKET_CARDS,
  PENALTY_CARD,
  STARTER_GOALIE,
  buildStartingDeck,
  buildPenaltySupply,
  shuffle,
} from './cards';
import { rollDieFace, rollD6, DIE_FACES } from './dice';
import { buildTurnEventDecks, PERIOD_END_CARD } from './events';
import { createCombatState, determineInitiative } from './combat';

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

let _logId = 0;
function makeLog(
  phase: GameState['phase'],
  shift: number,
  period: number,
  text: string,
  type: LogEntry['type'] = 'info'
): LogEntry {
  return { id: `log_${++_logId}`, phase, shift, period, text, type };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function capTokens(tokens: Tokens, caps: Tokens = TOKEN_CAPS): Tokens {
  return {
    energy: clamp(tokens.energy, 0, caps.energy),
    shoot: clamp(tokens.shoot, 0, caps.shoot),
    block: clamp(tokens.block, 0, caps.block),
  };
}

function gainTokens(tokens: Tokens, gain: Partial<Tokens>): Tokens {
  return {
    energy: tokens.energy + (gain.energy ?? 0),
    shoot: tokens.shoot + (gain.shoot ?? 0),
    block: tokens.block + (gain.block ?? 0),
  };
}

function loseTokens(tokens: Tokens, lose: Partial<Tokens>): Tokens {
  return {
    energy: Math.max(0, tokens.energy - (lose.energy ?? 0)),
    shoot: Math.max(0, tokens.shoot - (lose.shoot ?? 0)),
    block: Math.max(0, tokens.block - (lose.block ?? 0)),
  };
}

function drawCards(player: PlayerState, count: number): PlayerState {
  let deck = [...player.deck];
  let discard = [...player.discard];
  const drawn: typeof player.hand = [];

  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard);
      discard = [];
    }
    drawn.push(deck.shift()!);
  }

  return { ...player, deck, discard, hand: [...player.hand, ...drawn] };
}

function emptyLineup(): LineupSlot[] {
  const positions: LineupPosition[] = [
    'forward_1', 'forward_2', 'forward_3', 'defense_1', 'defense_2',
  ];
  return positions.map((position) => ({ position, card: null, faceDown: false }));
}

function makeInitialPlayer(id: 0 | 1, name: string): PlayerState {
  const starterDeck = shuffle(buildStartingDeck(id));
  // Draw opening hand of 5
  let player: PlayerState = {
    id,
    name,
    score: 0,
    deck: starterDeck,
    hand: [],
    discard: [],
    lineup: emptyLineup(),
    goalie: { ...STARTER_GOALIE, id: `gs_p${id}` },
    tokens: { energy: 2, shoot: 1, block: 0 },
    shootTokensCommitted: 0,
    blockTokensCommitted: 0,
    rolledDice: [],
    energyPipsTotal: 0,
    shootPipsTotal: 0,
    blockPipsTotal: 0,
    goalieBlockPips: 0,
    goalieShutout: false,
    goalieSwapped: false,
    pendingPenalties: [],
  };
  player = drawCards(player, 5);
  return player;
}

function makePeriod(number: 1 | 2 | 3, eventPile: ReturnType<typeof buildTurnEventDecks>['period1']): PeriodState {
  return {
    number,
    eventDeck: eventPile,
    eventDiscard: [],
    currentEvent: null,
    isOver: false,
  };
}

function makeMarket(deck: typeof ALL_MARKET_CARDS): { slots: MarketSlot[]; remaining: typeof ALL_MARKET_CARDS } {
  const shuffled = shuffle([...deck]);
  const slots: MarketSlot[] = shuffled.slice(0, 6).map((card, i) => ({
    id: `slot_${i}`,
    card,
  }));
  return { slots, remaining: shuffled.slice(6) };
}

function refillMarket(slots: MarketSlot[], deck: typeof ALL_MARKET_CARDS): { slots: MarketSlot[]; remaining: typeof ALL_MARKET_CARDS } {
  let remaining = [...deck];
  const newSlots = slots.map((slot) => {
    if (slot.card !== null) return slot;
    if (remaining.length === 0) return slot;
    const [next, ...rest] = remaining;
    remaining = rest;
    return { ...slot, card: next };
  });
  return { slots: newSlots, remaining };
}

function rollPlayerDice(player: PlayerState): RolledDie[] {
  const dice: RolledDie[] = [];
  let dieIdx = 0;

  for (const slot of player.lineup) {
    if (!slot.card) continue;
    const dieTypeId = slot.faceDown || slot.card.category === 'rookie' || slot.card.category === 'penalty'
      ? 'R'
      : slot.card.dieTypeId;

    if (slot.card.category === 'penalty') {
      // Penalty card: no die rolled
      continue;
    }

    const { faceIndex, face } = rollDieFace(dieTypeId);
    dice.push({
      id: `die_p${player.id}_${dieIdx++}`,
      dieTypeId,
      cardId: slot.card.id,
      faceIndex,
      face,
      zone: face.type === 'blank' ? 'unassigned' : (
        face.type === 'energy' ? 'energy' :
        face.type === 'shoot' ? 'shoot' :
        face.type === 'block' ? 'block' :
        'unassigned'
      ),
      isGoalie: false,
      rerolled: false,
    });
  }

  // Goalie die — always rolled
  if (player.goalie) {
    const dieTypeId = player.goalie.dieTypeId;
    const { faceIndex, face } = rollDieFace(dieTypeId);
    dice.push({
      id: `die_p${player.id}_goalie`,
      dieTypeId,
      cardId: player.goalie.id,
      faceIndex,
      face,
      zone: face.type === 'shutout' ? 'block' : (face.type === 'block' ? 'block' : 'unassigned'),
      isGoalie: true,
      rerolled: false,
    });
  }

  return dice;
}

function computeLineupEnergyBonus(player: PlayerState, currentEventMods: { noLineupBonus?: boolean; extraLineupBonus?: number }): number {
  if (currentEventMods.noLineupBonus) return 0;

  const faceUpForwards = player.lineup.filter(
    (s) => !s.faceDown && s.card && s.card.category === 'forward'
  ).length;
  const faceUpDefense = player.lineup.filter(
    (s) => !s.faceDown && s.card && s.card.category === 'defenseman'
  ).length;

  let bonus = 0;
  if (faceUpForwards >= 3) bonus += 2;
  else if (faceUpForwards === 2) bonus += 1;
  if (faceUpDefense >= 2) bonus += 1;

  bonus = Math.min(bonus, 3);
  bonus += (currentEventMods.extraLineupBonus ?? 0);
  return Math.max(0, bonus);
}

function hasDuplicateTier(player: PlayerState): boolean {
  const forwardTiers: number[] = [];
  const defenseTiers: number[] = [];

  for (const slot of player.lineup) {
    if (!slot.card || slot.faceDown) continue;
    if (slot.card.tier === 0) continue; // starters/rookies never trigger

    if (slot.card.category === 'forward' || slot.card.category === 'rookie') {
      // handled above — rookies don't count
    }

    if (slot.card.category === 'forward' && slot.card.tier > 0) {
      if (forwardTiers.includes(slot.card.tier)) return true;
      forwardTiers.push(slot.card.tier);
    }
    if (slot.card.category === 'defenseman' && slot.card.tier > 0) {
      if (defenseTiers.includes(slot.card.tier)) return true;
      defenseTiers.push(slot.card.tier);
    }
  }
  return false;
}

function sumZonePips(dice: RolledDie[], zone: 'energy' | 'shoot' | 'block'): number {
  let total = 0;
  for (const die of dice) {
    if (die.face.type === 'shutout') {
      // Shutout handled separately for block zone
      continue;
    }
    if (die.face.type === 'wild') {
      if (die.wildAssignedAs === zone) total += die.face.value;
      continue;
    }
    if (die.zone === zone && die.face.type !== 'blank') {
      total += die.face.value;
    }
  }
  return total;
}

function computeGoalieState(dice: RolledDie[]): { blockPips: number; shutout: boolean } {
  const goalieDie = dice.find((d) => d.isGoalie);
  if (!goalieDie) return { blockPips: 0, shutout: false };
  if (goalieDie.face.type === 'shutout') return { blockPips: 0, shutout: true };
  if (goalieDie.face.type === 'block') return { blockPips: goalieDie.face.value, shutout: false };
  return { blockPips: 0, shutout: false };
}

// -----------------------------------------------------------
// Initial Game State
// -----------------------------------------------------------
export function createInitialState(): GameState {
  return {
    shift: 0,
    period: 1,
    isOvertimeMode: false,
    periods: [
      makePeriod(1, []),
      makePeriod(2, []),
      makePeriod(3, []),
    ] as [PeriodState, PeriodState, PeriodState],
    players: [
      makeInitialPlayer(0, 'Player 1'),
      makeInitialPlayer(1, 'Player 2'),
    ],
    phase: 'setup',
    faceoff: null,
    combat: null,
    marketSlots: [],
    marketDeck: [],
    penaltySupply: buildPenaltySupply(),
    buyPhaseActivePlayer: null,
    log: [],
    activeScreenPlayer: null,
    overtimeLineupFormat: false,
    winner: null,
  };
}

// -----------------------------------------------------------
// Reducer
// -----------------------------------------------------------
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const { playerNames } = action;
      const eventDecks = buildTurnEventDecks();
      const { slots: marketSlots, remaining: marketDeck } = makeMarket(ALL_MARKET_CARDS);

      const p0 = makeInitialPlayer(0, playerNames[0]);
      const p1 = makeInitialPlayer(1, playerNames[1]);

      const periods: [PeriodState, PeriodState, PeriodState] = [
        makePeriod(1, eventDecks.period1),
        makePeriod(2, eventDecks.period2),
        makePeriod(3, eventDecks.period3),
      ];

      return {
        ...state,
        phase: 'phase1_faceoff',
        shift: 1,
        period: 1,
        players: [p0, p1],
        periods,
        marketSlots,
        marketDeck,
        penaltySupply: buildPenaltySupply(),
        faceoff: { rolls: [null, null], winner: null },
        log: [makeLog('phase1_faceoff', 1, 1, `Game started! ${playerNames[0]} vs ${playerNames[1]}.`)],
        activeScreenPlayer: null,
      };
    }

    case 'ROLL_FACEOFF': {
      const { playerId, roll } = action;
      if (state.phase !== 'phase1_faceoff') return state;

      const prevFaceoff = state.faceoff ?? { rolls: [null, null] as [null, null], winner: null };
      const rolls: [number | null, number | null] = [...prevFaceoff.rolls] as [number | null, number | null];
      rolls[playerId] = roll;

      let winner: 0 | 1 | null = null;
      let newPhase: GameState['phase'] = 'phase1_faceoff';

      if (rolls[0] !== null && rolls[1] !== null) {
        if (rolls[0] > rolls[1]) winner = 0;
        else if (rolls[1] > rolls[0]) winner = 1;
        else {
          // Tie — reset for another roll
          const tieLog = makeLog('phase1_faceoff', state.shift, state.period,
            `Faceoff tie (${rolls[0]} vs ${rolls[1]})! Re-rolling...`);
          return { ...state, faceoff: { rolls: [null, null], winner: null, tieRolls: [...(prevFaceoff.tieRolls ?? []), rolls as [number, number]] }, log: [...state.log, tieLog] };
        }
        newPhase = 'phase2_turn_event';
      }

      const logs = winner !== null
        ? [makeLog('phase1_faceoff', state.shift, state.period,
            `Faceoff: ${state.players[0].name} rolled ${rolls[0]}, ${state.players[1].name} rolled ${rolls[1]}. ${state.players[winner].name} wins the faceoff!`)]
        : [];

      return {
        ...state,
        faceoff: { rolls: rolls as [number | null, number | null], winner },
        phase: newPhase,
        log: [...state.log, ...logs],
      };
    }

    case 'FLIP_EVENT_CARD': {
      if (state.phase !== 'phase2_turn_event') return state;
      const periodIdx = state.period - 1;
      const period = state.periods[periodIdx];
      const [card, ...remaining] = period.eventDeck;

      if (!card) {
        // Period is over
        return advancePeriodOrEnd(state);
      }

      const isPeriodEnd = card.isPeriodEnd || remaining.length === 0;
      const updatedPeriod: PeriodState = {
        ...period,
        eventDeck: remaining,
        eventDiscard: [...period.eventDiscard, card],
        currentEvent: card,
        isOver: isPeriodEnd,
      };

      const periods = [...state.periods] as [PeriodState, PeriodState, PeriodState];
      periods[periodIdx] = updatedPeriod;

      const logText = card.isPeriodEnd
        ? `Period ${state.period} End card revealed! Period is over.`
        : `Turn Event: "${card.name}" — ${card.effects.map(e => e.description).join(' | ')}`;

      // We stay in phase2_turn_event so the UI can show the event card and handle immediate effects
      return {
        ...state,
        periods,
        log: [...state.log, makeLog('phase2_turn_event', state.shift, state.period, logText, 'event')],
      };
    }

    case 'CONTINUE_TO_LINEUP': {
      return { ...state, phase: 'phase3_lineup' };
    }

    case 'RESOLVE_IMMEDIATE_EVENT': {
      // Apply an immediate event effect on behalf of a player.
      // Do NOT advance phase here — the UI gates CONTINUE_TO_LINEUP until all
      // required choices are confirmed, so we stay in phase2_turn_event.
      const { playerId, tokenLost, amount = 1 } = action;
      if (playerId === undefined || !tokenLost) return state;

      const periodIdx = state.period - 1;
      const event = state.periods[periodIdx].currentEvent;
      if (!event) return state;

      const players = [...state.players] as [PlayerState, PlayerState];
      const player = { ...players[playerId] };
      player.tokens = loseTokens(player.tokens, { [tokenLost]: amount });
      players[playerId] = player;

      return { ...state, players };
    }

    case 'PLACE_CARD_IN_LINEUP': {
      const { playerId, cardId, position, faceDown } = action;
      const player = { ...state.players[playerId] };

      // Find card in hand
      const cardIdx = player.hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return state;
      const card = player.hand[cardIdx];

      // Remove from hand
      const hand = player.hand.filter((_, i) => i !== cardIdx);

      // Place in lineup slot
      const lineup = player.lineup.map((slot) => {
        if (slot.position !== position) return slot;
        // Return existing card to hand if slot was occupied
        return { ...slot, card, faceDown };
      });

      // Also handle returning the previous occupant to hand
      const prevOccupant = player.lineup.find((s) => s.position === position)?.card;
      const finalHand = prevOccupant && prevOccupant.id !== cardId
        ? [...hand, prevOccupant]
        : hand;

      const updatedPlayer = { ...player, hand: finalHand, lineup };
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = updatedPlayer;

      return { ...state, players };
    }

    case 'REMOVE_CARD_FROM_LINEUP': {
      const { playerId, position } = action;
      const player = { ...state.players[playerId] };
      const slot = player.lineup.find((s) => s.position === position);
      if (!slot?.card) return state;

      const card = slot.card;
      const lineup = player.lineup.map((s) =>
        s.position === position ? { ...s, card: null, faceDown: false } : s
      );
      const hand = [...player.hand, card];

      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, lineup, hand };
      return { ...state, players };
    }

    case 'SWAP_GOALIE': {
      const { playerId, newGoalieCardId } = action;
      const player = { ...state.players[playerId] };
      const newGoalie = player.hand.find((c) => c.id === newGoalieCardId);
      if (!newGoalie || newGoalie.category !== 'goalie') return state;

      const oldGoalie = player.goalie;
      const hand = player.hand.filter((c) => c.id !== newGoalieCardId);
      const finalHand = oldGoalie ? [...hand, oldGoalie] : hand;

      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, goalie: newGoalie, hand: finalHand, goalieSwapped: true };
      return { ...state, players };
    }

    case 'CONFIRM_LINEUP': {
      // Both players must confirm before moving to Phase 4
      // Track via a simple flag on players (use goalieSwapped as confirm flag for simplicity)
      return state; // handled by UI advancing to REVEAL_LINEUPS
    }

    case 'REVEAL_LINEUPS': {
      // Phase 4: Reveal lineups, enforce duplicates, award lineup energy
      let players = [...state.players] as [PlayerState, PlayerState];
      const logs: LogEntry[] = [];
      const periodIdx = state.period - 1;
      const event = state.periods[periodIdx].currentEvent;
      const eventMods = {
        noLineupBonus: event?.effects.some(e => e.ongoingModifier?.type === 'no_lineup_bonus') ?? false,
        extraLineupBonus: event?.effects.reduce((sum, e) =>
          e.ongoingModifier?.type === 'extra_lineup_bonus' ? sum + (e.ongoingModifier as { type: 'extra_lineup_bonus'; amount: number }).amount : sum, 0) ?? 0,
      };

      for (let pid = 0; pid < 2; pid++) {
        const p = pid as 0 | 1;
        let player = { ...players[p] };

        // Check duplicates
        if (hasDuplicateTier(player)) {
          const penaltyCard = state.penaltySupply[0];
          if (penaltyCard) {
            player = { ...player, discard: [...player.discard, penaltyCard] };
            logs.push(makeLog('phase4_initial_reveal', state.shift, state.period,
              `${player.name} has duplicate tiers face-up — Penalty card added to discard!`, 'penalty'));
          }
        }

        // Lineup energy bonus
        const bonus = computeLineupEnergyBonus(player, eventMods);
        if (bonus > 0) {
          player = { ...player, tokens: gainTokens(player.tokens, { energy: bonus }) };
          logs.push(makeLog('phase4_initial_reveal', state.shift, state.period,
            `${player.name} earns +${bonus} Energy from lineup bonus.`));
        }

        // Handle pending penalty cards in hand — auto-place them face-up
        const penaltyInHand = player.hand.filter((c) => c.category === 'penalty');
        const alreadyHasPenalty = player.lineup.some((s) => s.card?.category === 'penalty');
        let hand = [...player.hand];

        for (const pen of penaltyInHand) {
          if (!alreadyHasPenalty) {
            // Must place face-up in an empty slot
            const emptySlot = player.lineup.find((s) => !s.card);
            if (emptySlot) {
              const lineup = player.lineup.map((s) =>
                s.position === emptySlot.position ? { ...s, card: pen, faceDown: false } : s
              );
              hand = hand.filter((c) => c.id !== pen.id);
              player = { ...player, lineup };
              logs.push(makeLog('phase4_initial_reveal', state.shift, state.period,
                `${player.name} draws a Penalty card — it's placed face-up in their lineup.`, 'penalty'));
            }
          }
        }
        player = { ...player, hand };
        players[p] = player;
      }

      return {
        ...state,
        players,
        phase: 'phase5_roll_assign',
        log: [...state.log, ...logs],
        activeScreenPlayer: 0,
      };
    }

    case 'ROLL_DICE': {
      const { playerId } = action;
      const player = { ...state.players[playerId] };
      const rolledDice = rollPlayerDice(player);
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, rolledDice };
      return { ...state, players };
    }

    case 'REROLL_DICE': {
      const { playerId, dieIds } = action;
      const player = { ...state.players[playerId] };
      const dice = player.rolledDice.map((die) => {
        if (!dieIds.includes(die.id) || die.rerolled) return die;
        const { faceIndex, face } = rollDieFace(die.dieTypeId);
        const defaultZone = face.type === 'energy' ? 'energy' as const
          : face.type === 'shoot' ? 'shoot' as const
          : face.type === 'block' ? 'block' as const
          : 'unassigned' as const;
        return { ...die, faceIndex, face, zone: defaultZone, rerolled: true, wildAssignedAs: undefined };
      });
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, rolledDice: dice };
      return { ...state, players };
    }

    case 'ASSIGN_WILD': {
      const { playerId, dieId, assignTo } = action;
      const player = { ...state.players[playerId] };
      const dice = player.rolledDice.map((die) =>
        die.id === dieId && die.face.type === 'wild'
          ? { ...die, wildAssignedAs: assignTo, zone: assignTo }
          : die
      );
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, rolledDice: dice };
      return { ...state, players };
    }

    case 'ASSIGN_DIE_TO_ZONE': {
      const { playerId, dieId, zone } = action;
      const player = { ...state.players[playerId] };
      const dice = player.rolledDice.map((die) =>
        die.id === dieId ? { ...die, zone } : die
      );
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, rolledDice: dice };
      return { ...state, players };
    }

    case 'COMMIT_SHOOT_TOKENS': {
      const { playerId, amount } = action;
      const player = { ...state.players[playerId] };
      const committed = Math.min(amount, player.tokens.shoot);
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, shootTokensCommitted: committed };
      return { ...state, players };
    }

    case 'CONFIRM_ROLL_ASSIGN': {
      // Both players confirmed — move to Phase 6
      return { ...state, phase: 'phase6_final_reveal', activeScreenPlayer: null };
    }

    case 'REVEAL_ROLLS': {
      // Compute energy pips and shoot pips for initiative
      let players = [...state.players] as [PlayerState, PlayerState];
      const logs: LogEntry[] = [];

      for (let pid = 0; pid < 2; pid++) {
        const p = pid as 0 | 1;
        let player = { ...players[p] };

        const energyPips = sumZonePips(player.rolledDice, 'energy');
        const shootPips = sumZonePips(player.rolledDice, 'shoot');
        const blockPips = sumZonePips(player.rolledDice.filter(d => !d.isGoalie), 'block');
        const goalieState = computeGoalieState(player.rolledDice);

        player = {
          ...player,
          energyPipsTotal: energyPips,
          shootPipsTotal: shootPips,
          blockPipsTotal: blockPips,
          goalieBlockPips: goalieState.blockPips,
          goalieShutout: goalieState.shutout,
        };

        // Convert energy pips to tokens
        player = { ...player, tokens: gainTokens(player.tokens, { energy: energyPips }) };
        logs.push(makeLog('phase6_final_reveal', state.shift, state.period,
          `${player.name}: +${energyPips} Energy from dice.`));

        // Final reveal abilities (simplified — gain shoot/block tokens from abilities)
        // Abilities are text-based in this build; UI shows them and player applies them
        players[p] = player;
      }

      return { ...state, players, log: [...state.log, ...logs] };
    }

    case 'CONVERT_ENERGY_PIPS': {
      const { playerId } = action;
      const player = { ...state.players[playerId] };
      const energy = player.energyPipsTotal;
      const updatedPlayer = {
        ...player,
        tokens: gainTokens(player.tokens, { energy }),
        energyPipsTotal: 0,
      };
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = updatedPlayer;
      return { ...state, players };
    }

    case 'DETERMINE_INITIATIVE': {
      const p0Shoot = state.players[0].shootPipsTotal;
      const p1Shoot = state.players[1].shootPipsTotal;

      if (p0Shoot === p1Shoot) {
        // Need tiebreaker — set combat state waiting for rolls
        return {
          ...state,
          phase: 'phase7_shooting',
          combat: { ...createCombatState(), initiativeWinner: null },
          log: [...state.log, makeLog('phase6_final_reveal', state.shift, state.period,
            `Shooting initiative tied (${p0Shoot} each) — rolling for tiebreaker!`)],
        };
      }

      const winner: 0 | 1 = p0Shoot > p1Shoot ? 0 : 1;
      return {
        ...state,
        phase: 'phase7_shooting',
        combat: { ...createCombatState(), initiativeWinner: winner },
        log: [...state.log, makeLog('phase6_final_reveal', state.shift, state.period,
          `${state.players[winner].name} wins shooting initiative with ${Math.max(p0Shoot, p1Shoot)} vs ${Math.min(p0Shoot, p1Shoot)} Shoot pips!`)],
      };
    }

    case 'ROLL_INITIATIVE_TIEBREAKER': {
      const { rolls } = action;
      const winner: 0 | 1 = rolls[0] >= rolls[1] ? 0 : 1;
      return {
        ...state,
        combat: { ...state.combat!, initiativeWinner: winner, initiativeRolls: rolls },
        log: [...state.log, makeLog('phase7_shooting', state.shift, state.period,
          `Tiebreaker rolls: ${state.players[0].name} rolled ${rolls[0]}, ${state.players[1].name} rolled ${rolls[1]}. ${state.players[winner].name} attacks first!`)],
      };
    }

    case 'COMMIT_BLOCK_TOKENS': {
      const { playerId, amount } = action;
      const player = { ...state.players[playerId] };
      const committed = Math.min(amount, player.tokens.block);
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = { ...player, blockTokensCommitted: committed };
      return { ...state, players };
    }

    case 'RESOLVE_WAVE': {
      const { wave, attackRolls, blockRolls } = action;
      const combat = state.combat!;
      const attackerId = wave === 1 ? combat.initiativeWinner! : (combat.initiativeWinner === 0 ? 1 : 0);
      const defenderId = attackerId === 0 ? 1 : 0;

      const attacker = state.players[attackerId];
      const defender = state.players[defenderId];

      const attackPipTotal = attackRolls.reduce((s, v) => s + v, 0);
      const attackTotal = attackPipTotal + attacker.shootTokensCommitted;

      const blockPipTotal = blockRolls.reduce((s, v) => s + v, 0);
      const shutoutContrib = defender.goalieShutout ? 5 : 0;
      const blockTotal = blockPipTotal + defender.blockTokensCommitted + shutoutContrib;

      const isGoal = attackTotal > blockTotal;

      const waveResult = {
        wave,
        attackerId,
        defenderId,
        attackPips: attacker.shootPipsTotal,
        attackTokens: attacker.shootTokensCommitted,
        attackRolls,
        attackTotal,
        blockPips: defender.blockPipsTotal + defender.goalieBlockPips,
        blockTokens: defender.blockTokensCommitted,
        blockRolls,
        blockTotal,
        shutoutContribution: shutoutContrib,
        isGoal,
      };

      let players = [...state.players] as [PlayerState, PlayerState];
      const logs: LogEntry[] = [];

      if (isGoal) {
        players[attackerId] = {
          ...players[attackerId],
          score: players[attackerId].score + 1,
          tokens: gainTokens(players[attackerId].tokens, { energy: GOAL_ENERGY_BONUS }),
        };
        logs.push(makeLog('phase7_shooting', state.shift, state.period,
          `GOAL! ${players[attackerId].name} scores! Attack ${attackTotal} beats Defense ${blockTotal}. (+2 Energy bonus)`, 'goal'));
      } else {
        logs.push(makeLog('phase7_shooting', state.shift, state.period,
          `BLOCKED! ${players[defenderId].name} holds. Defense ${blockTotal} stops Attack ${attackTotal}.`, 'block'));
      }

      // Consume shoot/block tokens used
      players[attackerId] = {
        ...players[attackerId],
        tokens: loseTokens(players[attackerId].tokens, { shoot: attacker.shootTokensCommitted }),
        shootTokensCommitted: 0,
      };
      players[defenderId] = {
        ...players[defenderId],
        tokens: loseTokens(players[defenderId].tokens, { block: defender.blockTokensCommitted }),
        blockTokensCommitted: 0,
      };

      const newCombat = {
        ...combat,
        ...(wave === 1 ? { wave1: waveResult } : { wave2: waveResult }),
      };

      // After wave 1: apply puck control if goal, then proceed to wave 2
      if (wave === 1) {
        const wave2AttackerId: 0 | 1 = attackerId === 0 ? 1 : 0;
        if (isGoal) {
          // Strip wave 2 attacker's committed shoot tokens
          players[wave2AttackerId] = {
            ...players[wave2AttackerId],
            shootTokensCommitted: 0,
          };
          logs.push(makeLog('phase7_shooting', state.shift, state.period,
            `Puck Control: ${players[wave2AttackerId].name}'s Shoot tokens are stripped — counter-attack with raw pips only!`, 'info'));
        }

        return {
          ...state,
          players,
          combat: { ...newCombat, puckControlStripped: isGoal },
          phase: 'phase7_wave2_defense',
          log: [...state.log, ...logs],
        };
      }

      // Wave 2 done — move to buy phase
      // Determine who buys first: the player who shot second in wave 2
      const wave2AttackerId: 0 | 1 = attackerId;
      const buyFirst: 0 | 1 = wave2AttackerId === 0 ? 1 : 0;

      return {
        ...state,
        players,
        combat: newCombat,
        phase: 'phase8_buy',
        buyPhaseActivePlayer: buyFirst,
        log: [...state.log, ...logs],
      };
    }

    case 'APPLY_PUCK_CONTROL': {
      // Strip wave 2 attacker's committed tokens
      const wave2AttackerId: 0 | 1 = state.combat?.initiativeWinner === 0 ? 1 : 0;
      const player = { ...state.players[wave2AttackerId] };
      const stripped = player.shootTokensCommitted;
      const players = [...state.players] as [PlayerState, PlayerState];
      players[wave2AttackerId] = {
        ...player,
        shootTokensCommitted: 0,
        tokens: loseTokens(player.tokens, { shoot: stripped }),
      };
      return {
        ...state,
        players,
        combat: { ...state.combat!, puckControlStripped: true },
        phase: 'phase7_wave2_defense',
      };
    }

    case 'DRAFT_CARD': {
      const { playerId, marketSlotId } = action;
      const player = { ...state.players[playerId] };
      const slot = state.marketSlots.find((s) => s.id === marketSlotId);
      if (!slot?.card) return state;

      const periodIdx = state.period - 1;
      const event = state.periods[periodIdx].currentEvent;
      const discount = event?.effects.reduce((sum, e) =>
        e.ongoingModifier?.type === 'market_discount' ? sum + (e.ongoingModifier as { type: 'market_discount'; amount: number }).amount : sum, 0) ?? 0;
      const cost = Math.max(1, slot.card.cost - discount);

      if (player.tokens.energy < cost) return state;

      const updatedPlayer = {
        ...player,
        tokens: loseTokens(player.tokens, { energy: cost }),
        discard: [...player.discard, slot.card],
      };
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = updatedPlayer;

      const newSlots = state.marketSlots.map((s) =>
        s.id === marketSlotId ? { ...s, card: null } : s
      );
      const { slots, remaining } = refillMarket(newSlots, state.marketDeck);

      return {
        ...state,
        players,
        marketSlots: slots,
        marketDeck: remaining,
        log: [...state.log, makeLog('phase8_buy', state.shift, state.period,
          `${player.name} drafts ${slot.card.name} for ${cost} Energy.`, 'buy')],
      };
    }

    case 'TRADE_CARD': {
      const { playerId, marketSlotId, trashCardId } = action;
      const player = { ...state.players[playerId] };
      const slot = state.marketSlots.find((s) => s.id === marketSlotId);
      if (!slot?.card) return state;

      const cost = tradeCost(slot.card);
      if (player.tokens.energy < cost) return state;

      const trashFromHand = player.hand.find((c) => c.id === trashCardId);
      const trashFromDiscard = player.discard.find((c) => c.id === trashCardId);
      if (!trashFromHand && !trashFromDiscard) return state;

      const hand = trashFromHand ? player.hand.filter((c) => c.id !== trashCardId) : player.hand;
      const discard = trashFromDiscard ? player.discard.filter((c) => c.id !== trashCardId) : player.discard;

      const updatedPlayer = {
        ...player,
        tokens: loseTokens(player.tokens, { energy: cost }),
        hand,
        discard: [...discard, slot.card],
      };
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = updatedPlayer;

      const newSlots = state.marketSlots.map((s) =>
        s.id === marketSlotId ? { ...s, card: null } : s
      );
      const { slots, remaining } = refillMarket(newSlots, state.marketDeck);

      const trashed = trashFromHand ?? trashFromDiscard!;
      return {
        ...state,
        players,
        marketSlots: slots,
        marketDeck: remaining,
        log: [...state.log, makeLog('phase8_buy', state.shift, state.period,
          `${player.name} trades ${slot.card.name} for ${cost} Energy, trashing ${trashed.name}.`, 'buy')],
      };
    }

    case 'SCOUT_CARD': {
      const { playerId, marketSlotId } = action;
      const player = { ...state.players[playerId] };
      if (player.tokens.energy < SCOUTING_COST) return state;

      const slot = state.marketSlots.find((s) => s.id === marketSlotId);
      if (!slot?.card) return state;

      const updatedPlayer = {
        ...player,
        tokens: loseTokens(player.tokens, { energy: SCOUTING_COST }),
      };
      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = updatedPlayer;

      const newSlots = state.marketSlots.map((s) =>
        s.id === marketSlotId ? { ...s, card: null } : s
      );
      const { slots, remaining } = refillMarket(newSlots, state.marketDeck);

      return {
        ...state,
        players,
        marketSlots: slots,
        marketDeck: remaining,
        log: [...state.log, makeLog('phase8_buy', state.shift, state.period,
          `${player.name} scouts (trashes) ${slot.card.name} for ${SCOUTING_COST} Energy.`, 'buy')],
      };
    }

    case 'BUY_TOKEN': {
      const { playerId, tokenType } = action;
      const player = { ...state.players[playerId] };
      if (player.tokens.energy < TOKEN_PURCHASE_COST) return state;

      const players = [...state.players] as [PlayerState, PlayerState];
      players[playerId] = {
        ...player,
        tokens: gainTokens(loseTokens(player.tokens, { energy: TOKEN_PURCHASE_COST }), { [tokenType]: 1 }),
      };

      return {
        ...state,
        players,
        log: [...state.log, makeLog('phase8_buy', state.shift, state.period,
          `${state.players[playerId].name} buys 1 ${tokenType} token for ${TOKEN_PURCHASE_COST} Energy.`, 'buy')],
      };
    }

    case 'END_BUY_PHASE': {
      const { playerId } = action;
      const logText = `${state.players[playerId].name} ends their buy phase.`;
      const hasOtherPlayerEnded = state.log.slice(-10).some(l => l.text.includes('ends their buy phase'));
      if (hasOtherPlayerEnded) {
        return { ...state, phase: 'phase9_cleanup', buyPhaseActivePlayer: null, log: [...state.log, makeLog('phase8_buy', state.shift, state.period, logText)] };
      }
      return { ...state, buyPhaseActivePlayer: playerId === 0 ? 1 : 0, log: [...state.log, makeLog('phase8_buy', state.shift, state.period, logText)] };
    }
    case 'DUMMY_END_BUY_PHASE_OLD': {
      const { playerId } = action;
      // If active player just ended, switch to other player or move to cleanup
      const otherPlayer: 0 | 1 = playerId === 0 ? 1 : 0;
      if (state.buyPhaseActivePlayer === playerId) {
        // Other player gets their turn now
        return { ...state, buyPhaseActivePlayer: otherPlayer };
      }
      // Both done — cleanup
      return { ...state, phase: 'phase9_cleanup', buyPhaseActivePlayer: null };
    }

    case 'CLEANUP': {
      let players = [...state.players] as [PlayerState, PlayerState];
      const periodIdx = state.period - 1;
      const period = state.periods[periodIdx];
      const logs: LogEntry[] = [];

      for (let pid = 0; pid < 2; pid++) {
        const p = pid as 0 | 1;
        let player = { ...players[p] };

        // Discard lineup cards (not goalie, not penalty)
        const lineupCards = player.lineup
          .filter((s) => s.card && s.card.category !== 'goalie')
          .map((s) => s.card!);

        // Penalties return to supply — others to discard
        const returnsToSupply = lineupCards.filter((c) => c.category === 'penalty');
        const toDiscard = lineupCards.filter((c) => c.category !== 'penalty');

        player = {
          ...player,
          lineup: emptyLineup(),
          discard: [...player.discard, ...toDiscard],
          hand: [], // hand discarded
          rolledDice: [],
          energyPipsTotal: 0,
          shootPipsTotal: 0,
          blockPipsTotal: 0,
          goalieBlockPips: 0,
          goalieShutout: false,
          goalieSwapped: false,
          shootTokensCommitted: 0,
          blockTokensCommitted: 0,
          tokens: capTokens(player.tokens),
        };

        // Draw new hand of 5
        player = drawCards(player, 5);
        players[p] = player;
      }

      // Check if period just ended
      if (period.isOver) {
        return advancePeriodOrEnd({ ...state, players, log: [...state.log, ...logs] });
      }

      // Next shift
      const nextShift = state.shift + 1;
      return {
        ...state,
        players,
        phase: 'phase1_faceoff',
        shift: nextShift,
        faceoff: { rolls: [null, null], winner: null },
        combat: null,
        log: [...state.log, ...logs, makeLog('phase1_faceoff', nextShift, state.period,
          `Shift ${nextShift} begins — Faceoff!`)],
        activeScreenPlayer: null,
      };
    }

    case 'NEXT_SHIFT': {
      return gameReducer(state, { type: 'CLEANUP' });
    }

    case 'ENTER_OVERTIME': {
      return {
        ...state,
        isOvertimeMode: true,
        overtimeLineupFormat: true,
        phase: 'phase1_faceoff',
        shift: state.shift + 1,
        faceoff: { rolls: [null, null], winner: null },
        combat: null,
        log: [...state.log, makeLog('overtime', state.shift + 1, 3,
          'OVERTIME! Sudden death 3-on-3. First goal wins!', 'event')],
      };
    }

    case 'RESET_GAME': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// -----------------------------------------------------------
// Period transition helper
// -----------------------------------------------------------
function advancePeriodOrEnd(state: GameState): GameState {
  const currentPeriod = state.period;

  if (currentPeriod >= 3) {
    // Game over — determine winner
    const [p0, p1] = state.players;
    if (p0.score > p1.score) {
      return { ...state, phase: 'game_over', winner: 0, log: [...state.log, makeLog('game_over', state.shift, 3, `Game over! ${p0.name} wins ${p0.score}–${p1.score}!`, 'goal')] };
    } else if (p1.score > p0.score) {
      return { ...state, phase: 'game_over', winner: 1, log: [...state.log, makeLog('game_over', state.shift, 3, `Game over! ${p1.name} wins ${p1.score}–${p0.score}!`, 'goal')] };
    } else {
      return { ...state, phase: 'overtime', winner: null, log: [...state.log, makeLog('overtime', state.shift, 3, 'Tied after 3 periods — Sudden Death Overtime!', 'event')] };
    }
  }

  const nextPeriod = (currentPeriod + 1) as 1 | 2 | 3;

  // Zamboni Wipe: flush market, deal 6 new cards
  const shuffledAll = shuffle([...ALL_MARKET_CARDS]);
  const newSlots: MarketSlot[] = shuffledAll.slice(0, 6).map((card, i) => ({ id: `slot_p${nextPeriod}_${i}`, card }));
  const newDeck = shuffledAll.slice(6);

  return {
    ...state,
    period: nextPeriod,
    phase: 'intermission',
    marketSlots: newSlots,
    marketDeck: newDeck,
    log: [...state.log, makeLog('intermission', state.shift, nextPeriod,
      `Period ${currentPeriod} over! Intermission — fresh market for Period ${nextPeriod}.`, 'event')],
  };
}
