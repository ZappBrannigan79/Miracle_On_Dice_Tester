// ============================================================
// MIRACLE ON DICE — Turn Event Card Definitions
// Sourced from nandeckhockey.csv rows 115–155
// ============================================================

import type { TurnEventCard } from './types';
import { shuffle } from './cards';

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
function both(
  id: string, name: string,
  description: string,
  timing: 'immediate' | 'ongoing' = 'immediate',
  ongoingType: string = 'none',
): TurnEventCard {
  return {
    id, name,
    effects: [{
      target: 'both',
      timing,
      description,
      immediateEffect: timing === 'immediate' ? { type: 'no_effect' } : undefined,
      ongoingModifier: { type: ongoingType as any },
    }],
    isStandardShift: false,
    isPeriodEnd: false,
  };
}

function winner(id: string, name: string, description: string): TurnEventCard {
  return {
    id, name,
    effects: [{
      target: 'faceoff_winner',
      timing: 'immediate',
      description,
      immediateEffect: { type: 'no_effect' },
      ongoingModifier: { type: 'none' },
    }],
    isStandardShift: false,
    isPeriodEnd: false,
  };
}

function loser(id: string, name: string, description: string, timing: 'immediate'|'ongoing' = 'immediate'): TurnEventCard {
  return {
    id, name,
    effects: [{
      target: 'faceoff_loser',
      timing,
      description,
      immediateEffect: timing === 'immediate' ? { type: 'no_effect' } : undefined,
      ongoingModifier: { type: 'none' },
    }],
    isStandardShift: false,
    isPeriodEnd: false,
  };
}

// -----------------------------------------------------------
// Period End (sentinel — placed beneath each period pile)
// -----------------------------------------------------------
export const PERIOD_END_CARD: TurnEventCard = {
  id: 'period_end',
  name: 'Period End',
  effects: [{
    target: 'both',
    timing: 'immediate',
    description: 'End Period after this turn. Shuffle discard into deck before next turn.',
    immediateEffect: { type: 'no_effect' },
    ongoingModifier: { type: 'none' },
  }],
  isStandardShift: false,
  isPeriodEnd: true,
};

// -----------------------------------------------------------
// Standard Shift filler cards (10 total — "No Bonus this turn")
// -----------------------------------------------------------
export const STANDARD_SHIFT_CARDS: TurnEventCard[] = Array.from({ length: 10 }, (_, i) => ({
  id: `standard_shift_${i}`,
  name: 'Standard Shift',
  effects: [{
    target: 'both' as const,
    timing: 'ongoing' as const,
    description: 'No bonus this turn. Play as normal.',
    immediateEffect: { type: 'no_effect' as const },
    ongoingModifier: { type: 'none' as const },
  }],
  isStandardShift: true,
  isPeriodEnd: false,
}));

// -----------------------------------------------------------
// Dynamic Turn Event Cards (30 total — from CSV rows 115–144)
// -----------------------------------------------------------
export const DYNAMIC_EVENT_CARDS: TurnEventCard[] = [
  // Row 115 — Both Players: Gain 1 ENERGY Token
  both('evt_01', 'Energy Boost', 'Both Players: Gain 1 ENERGY token.'),

  // Row 116 — Faceoff Winner: Gain 2 ENERGY Tokens
  winner('evt_02', 'Power Play', 'Faceoff Winner: Gain 2 ENERGY tokens.'),

  // Row 117 — Both Players: Gain 1 ENERGY + Draw +1 Card next turn
  both('evt_03', 'Line Change Windfall', 'Both Players: Gain 1 ENERGY token AND draw +1 card at the start of next turn.'),

  // Row 118 — Faceoff Winner: Gain 2 Tokens of your choice
  winner('evt_04', 'Momentum Shift', 'Faceoff Winner: Gain 2 tokens of your choice (ENERGY, SHOOT, or BLOCK).'),

  // Row 119 — Trailing Player: Gain 1 ENERGY Token (both if tied)
  both('evt_05', 'Comeback Trail', 'Trailing Player: Gain 1 ENERGY token. If tied, both players gain 1 ENERGY token.'),

  // Row 120 — Both Players: Gain 1 ENERGY + Trade costs -2 this turn
  both('evt_06', 'Trade Deadline', 'Both Players: Gain 1 ENERGY token. Trade costs are decreased by 2 this turn.'),

  // Row 121 — Both Players: Gain 1 ENERGY + Trash 1 Card from Discard
  both('evt_07', 'Roster Move', 'Both Players: Gain 1 ENERGY token. Trash 1 card from your discard pile.'),

  // Row 122 — Both Players: Gain 1 SHOOT Token
  both('evt_08', 'Open Ice', 'Both Players: Gain 1 SHOOT token.'),

  // Row 123 — Faceoff Winner: Gain 1 SHOOT Token
  winner('evt_09', 'Breakaway', 'Faceoff Winner: Gain 1 SHOOT token.'),

  // Row 124 — Both Players: Gain 2 ENERGY OR 2 SHOOT Tokens
  both('evt_10', "Coach's Choice", "Both Players: Gain 2 ENERGY tokens OR 2 SHOOT tokens (each player chooses independently)."),

  // Row 125 — Faceoff Winner: Gain 1 ENERGY + 1 SHOOT Token
  winner('evt_11', 'Offensive Zone Entry', 'Faceoff Winner: Gain 1 ENERGY token AND 1 SHOOT token.'),

  // Row 126 — Trailing Player: Gain 1 SHOOT Token (both if tied)
  both('evt_12', 'Counter Rush', 'Trailing Player: Gain 1 SHOOT token. If tied, both players gain 1 SHOOT token.'),

  // Row 127 — Both Players: Gain 1 BLOCK Token
  both('evt_13', 'Penalty Kill', 'Both Players: Gain 1 BLOCK token.'),

  // Row 128 — Faceoff Winner: Gain 1 BLOCK Token
  winner('evt_14', 'Defensive Zone Faceoff', 'Faceoff Winner: Gain 1 BLOCK token.'),

  // Row 129 — Both Players: Gain 2 ENERGY OR 2 BLOCK Tokens
  both('evt_15', 'Two-Way Threat', 'Both Players: Gain 2 ENERGY tokens OR 2 BLOCK tokens (each player chooses independently).'),

  // Row 130 — Faceoff Winner: Gain 1 ENERGY + 1 BLOCK Token
  winner('evt_16', 'Defensive Stand', 'Faceoff Winner: Gain 1 ENERGY token AND 1 BLOCK token.'),

  // Row 131 — Both Players: All (non-WILD) SHOOT pips worth +1 this turn
  both('evt_17', 'Hot Streak', 'Both Players: All (non-WILD) SHOOT pip(s) are worth +1 this turn.', 'ongoing', 'shoot_pip_bonus'),

  // Row 132 — Trailing Player: Gain 1 BLOCK Token (both if tied)
  both('evt_18', 'Bounce Back', 'Trailing Player: Gain 1 BLOCK token. If tied, both players gain 1 BLOCK token.'),

  // Row 133 — Both Players: Goalie SHUTOUT adds only 2 BLOCK successes (instead of 5)
  both('evt_19', 'Goalie Challenge', 'Both Players: Goalie SHUTOUT faces add only 2 BLOCK successes this turn (instead of 5).', 'ongoing'),

  // Row 134 — Faceoff Winner: Gain 1 SHOOT + 1 BLOCK Token
  winner('evt_20', 'Two-Way Standout', 'Faceoff Winner: Gain 1 SHOOT token AND 1 BLOCK token.'),

  // Row 135 — Both Players: Gain 1 ENERGY + 2 Tokens of your choice
  both('evt_21', 'Full Roster', 'Both Players: Gain 1 ENERGY token AND 2 tokens of your choice (ENERGY, SHOOT, or BLOCK).'),

  // Row 136 — Both Players: May reroll any dice TWICE this turn
  both('evt_22', 'Extra Skate', 'Both Players: You may reroll any of your dice TWICE this turn (instead of once).', 'ongoing'),

  // Row 137 — Both Players: Gain 1 Token of your choice
  both('evt_23', 'Line Bonus', 'Both Players: Gain 1 token of your choice (ENERGY, SHOOT, or BLOCK).'),

  // Row 138 — Both Players: Lose 1 Token of your choice
  {
    id: 'evt_24', name: 'Bench Minor',
    effects: [{
      target: 'both', timing: 'immediate',
      description: 'Both Players: Lose 1 token of your choice (ENERGY, SHOOT, or BLOCK).',
      immediateEffect: { type: 'lose_token', tokenType: 'any', amount: 1 },
      ongoingModifier: { type: 'none' },
    }],
    isStandardShift: false, isPeriodEnd: false,
  },

  // Row 139 — Faceoff Loser: You shoot last this turn
  loser('evt_25', 'Turnover', 'Faceoff Loser: You shoot last this turn (your Wave 1 becomes Wave 2).', 'ongoing'),

  // Row 140 — Faceoff Loser: May not trade cards this turn
  loser('evt_26', 'Zone Trap', 'Faceoff Loser: You may not trade cards this turn. You may only draft.', 'ongoing'),

  // Row 141 — Faceoff Loser: Add 1 PENALTY Card to discard
  loser('evt_27', 'Icing Call', 'Faceoff Loser: Add 1 PENALTY card to your discard pile.'),

  // Row 142 — Faceoff Loser: Must play at least 1 card face-down
  loser('evt_28', 'Line Brawl', 'Faceoff Loser: You must play at least 1 card face-down this turn.', 'ongoing'),

  // Row 143 — Faceoff Loser: Lose 2 Tokens of your choice
  {
    id: 'evt_29', name: 'Roughing',
    effects: [{
      target: 'faceoff_loser', timing: 'immediate',
      description: 'Faceoff Loser: Lose 2 tokens of your choice (ENERGY, SHOOT, or BLOCK).',
      immediateEffect: { type: 'lose_token', tokenType: 'any', amount: 2 },
      ongoingModifier: { type: 'none' },
    }],
    isStandardShift: false, isPeriodEnd: false,
  },

  // Row 144 — Faceoff Loser: Lose 1 Token of your choice
  {
    id: 'evt_30', name: 'Delayed Penalty',
    effects: [{
      target: 'faceoff_loser', timing: 'immediate',
      description: 'Faceoff Loser: Lose 1 token of your choice (ENERGY, SHOOT, or BLOCK).',
      immediateEffect: { type: 'lose_token', tokenType: 'any', amount: 1 },
      ongoingModifier: { type: 'none' },
    }],
    isStandardShift: false, isPeriodEnd: false,
  },
];

// -----------------------------------------------------------
// Build the full Turn Event Deck and split into 3 period piles
// 40 cards total: 30 dynamic + 10 standard shift
// Each period gets 6 event cards + 1 Period End beneath
// Remaining 22 cards go back in the box
// -----------------------------------------------------------
export function buildTurnEventDecks(): {
  period1: TurnEventCard[];
  period2: TurnEventCard[];
  period3: TurnEventCard[];
} {
  const all = shuffle([...DYNAMIC_EVENT_CARDS, ...STANDARD_SHIFT_CARDS]);
  return {
    period1: all.slice(0, 6),
    period2: all.slice(6, 12),
    period3: all.slice(12, 18),
  };
}

// -----------------------------------------------------------
// Draw next event card from a period pile
// -----------------------------------------------------------
export function drawEventCard(pile: TurnEventCard[]): {
  card: TurnEventCard;
  remaining: TurnEventCard[];
  periodOver: boolean;
} {
  if (pile.length === 0) {
    return { card: PERIOD_END_CARD, remaining: [], periodOver: true };
  }
  const [card, ...remaining] = pile;
  const periodOver = remaining.length === 0;
  return { card, remaining, periodOver: card.isPeriodEnd || periodOver };
}
