// ============================================================
// MIRACLE ON DICE — Core Type Definitions
// ============================================================

// -----------------------------------------------------------
// Pip / Die Face
// -----------------------------------------------------------
export type PipType = 'energy' | 'shoot' | 'block' | 'wild' | 'shutout' | 'blank';

export interface DieFace {
  type: PipType;
  value: number; // for blank/shutout this is 0 / 5
}

export type DieTypeId =
  | 'FS' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'
  | 'DS' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
  | 'GS' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6'
  | 'R'   // Rookie (white)
  | 'COMBAT'; // Custom combat die: 2,2,1,1,0,0

// -----------------------------------------------------------
// Cards
// -----------------------------------------------------------
export type CardCategory = 'forward' | 'defenseman' | 'goalie' | 'rookie' | 'penalty';

export type CardTier = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = starter/rookie

export interface AbilityTrigger {
  when: 'initial_reveal' | 'final_reveal' | 'on_score' | 'on_block' | 'passive';
  description: string;
  effect: AbilityEffect;
}

export type AbilityEffect =
  | { type: 'gain_energy'; amount: number }
  | { type: 'gain_shoot'; amount: number }
  | { type: 'gain_block'; amount: number }
  | { type: 'wild_bonus'; bonus: number } // pip value bonus to wilds
  | { type: 'shoot_pip_bonus'; bonus: number } // bonus to non-wild shoot pips
  | { type: 'draw_card'; amount: number }
  | { type: 'trash_card' } // trash a card from hand/discard
  | { type: 'none' }; // informational only

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  tier: CardTier;
  isStarter: boolean;
  cost: number; // Energy to draft (0 for starters/rookies)
  tradeValue: number; // Gold shield value
  dieTypeId: DieTypeId;
  abilities: AbilityTrigger[];
  borderColor?: string; // UI hint
}

// -----------------------------------------------------------
// Rolled Die (in-play state)
// -----------------------------------------------------------
export interface RolledDie {
  id: string; // unique per roll instance
  dieTypeId: DieTypeId;
  cardId: string; // which card generated this die
  faceIndex: number; // 0-5, which face is showing
  face: DieFace; // resolved face
  zone: 'unassigned' | 'energy' | 'shoot' | 'block'; // where on the mat
  wildAssignedAs?: 'energy' | 'shoot' | 'block'; // if wild, where assigned
  isGoalie: boolean;
  rerolled: boolean; // has been rerolled already
}

// -----------------------------------------------------------
// Lineup Slot
// -----------------------------------------------------------
export type LineupPosition = 'forward_1' | 'forward_2' | 'forward_3' | 'defense_1' | 'defense_2';

export interface LineupSlot {
  position: LineupPosition;
  card: Card | null;
  faceDown: boolean; // played as rookie
}

// -----------------------------------------------------------
// Tokens
// -----------------------------------------------------------
export interface Tokens {
  energy: number;
  shoot: number;
  block: number;
}

// Caps per turn cleanup
export const TOKEN_CAPS: Tokens = { energy: 6, shoot: 3, block: 3 };

// -----------------------------------------------------------
// Turn Event Cards
// -----------------------------------------------------------
export type EventTarget = 'both' | 'faceoff_winner' | 'faceoff_loser';
export type EventTiming = 'immediate' | 'ongoing';

export interface EventEffect {
  target: EventTarget;
  timing: EventTiming;
  description: string;
  immediateEffect?: ImmediateEventEffect;
  ongoingModifier?: OngoingModifier;
}

export type ImmediateEventEffect =
  | { type: 'lose_token'; tokenType: 'any' | 'energy' | 'shoot' | 'block'; amount: number }
  | { type: 'gain_token'; tokenType: 'energy' | 'shoot' | 'block'; amount: number }
  | { type: 'gain_penalty' }
  | { type: 'no_effect' };

export type OngoingModifier =
  | { type: 'no_lineup_bonus' }        // Lineup Energy Bonus halved/cancelled
  | { type: 'extra_lineup_bonus'; amount: number }
  | { type: 'shoot_pip_bonus'; amount: number }
  | { type: 'block_pip_bonus'; amount: number }
  | { type: 'market_discount'; amount: number }
  | { type: 'token_cap_reduction'; tokenType: 'energy' | 'shoot' | 'block'; reduction: number }
  | { type: 'none' };

export interface TurnEventCard {
  id: string;
  name: string;
  effects: EventEffect[];
  isStandardShift: boolean; // true for the 10 filler "Standard Shift" cards
  isPeriodEnd: boolean;
}

// -----------------------------------------------------------
// Market
// -----------------------------------------------------------
export interface MarketSlot {
  id: string;
  card: Card | null; // null means empty, refill pending
}

// -----------------------------------------------------------
// Player State
// -----------------------------------------------------------
export interface PlayerState {
  id: 0 | 1; // player index
  name: string;
  score: number;
  deck: Card[];
  hand: Card[];
  discard: Card[];
  lineup: LineupSlot[];   // 5 slots (3F + 2D), set in Phase 3
  goalie: Card | null;    // active goalie card
  tokens: Tokens;
  // Phase 5 committed shoot tokens in shoot zone (subset of tokens.shoot)
  shootTokensCommitted: number;
  // Block tokens moved to block zone during Phase 7
  blockTokensCommitted: number;
  // Dice after rolling Phase 5
  rolledDice: RolledDie[];
  // Computed from dice zones after Final Reveal
  energyPipsTotal: number;
  shootPipsTotal: number;  // used for initiative
  blockPipsTotal: number;  // block zone dice pips
  goalieBlockPips: number;
  goalieShutout: boolean;
  // Whether goalie was swapped this turn
  goalieSwapped: boolean;
  // Penalty cards in hand waiting to be placed
  pendingPenalties: Card[];
}

// -----------------------------------------------------------
// Combat State (Phase 7)
// -----------------------------------------------------------
export interface WaveResult {
  wave: 1 | 2;
  attackerId: 0 | 1;
  attackPips: number;
  attackTokens: number;
  attackRolls: number[];
  attackTotal: number;
  defenderId: 0 | 1;
  blockPips: number;
  blockTokens: number;
  blockRolls: number[];
  blockTotal: number;
  shutoutContribution: number; // 5 if shutout, else 0
  isGoal: boolean;
}

export interface CombatState {
  initiativeWinner: 0 | 1 | null;
  initiativeRolls: [number, number] | null; // tiebreaker d6 rolls
  wave1?: WaveResult;
  wave2?: WaveResult;
  puckControlStripped: boolean; // whether wave 2 attacker had tokens stripped
}

// -----------------------------------------------------------
// Faceoff
// -----------------------------------------------------------
export interface FaceoffState {
  rolls: [number | null, number | null];
  winner: 0 | 1 | null;
  tieRolls?: Array<[number, number]>;
}

// -----------------------------------------------------------
// Game Phase
// -----------------------------------------------------------
export type GamePhase =
  | 'setup'
  | 'phase1_faceoff'
  | 'phase2_turn_event'
  | 'phase3_lineup'           // hidden info behind screen
  | 'phase4_initial_reveal'
  | 'phase5_roll_assign'      // hidden info behind screen
  | 'phase6_final_reveal'
  | 'phase7_shooting'
  | 'phase7_wave1_defense'    // defender committing blocks
  | 'phase7_wave1_resolve'
  | 'phase7_wave2_defense'
  | 'phase7_wave2_resolve'
  | 'phase8_buy'
  | 'phase9_cleanup'
  | 'intermission'
  | 'overtime'
  | 'game_over';

// -----------------------------------------------------------
// Period State
// -----------------------------------------------------------
export interface PeriodState {
  number: 1 | 2 | 3;
  eventDeck: TurnEventCard[]; // cards remaining face-down
  eventDiscard: TurnEventCard[]; // cards revealed this period
  currentEvent: TurnEventCard | null;
  isOver: boolean;
}

// -----------------------------------------------------------
// Buy Phase Log
// -----------------------------------------------------------
export interface BuyAction {
  playerId: 0 | 1;
  type: 'draft' | 'trade' | 'scout' | 'buy_token';
  card?: Card; // card drafted/traded/scouted
  trashCard?: Card; // card trashed in trade
  tokenType?: 'shoot' | 'block';
  energyCost: number;
}

// -----------------------------------------------------------
// Game Log Entry
// -----------------------------------------------------------
export interface LogEntry {
  id: string;
  phase: GamePhase;
  shift: number;
  period: number;
  text: string;
  type: 'info' | 'goal' | 'block' | 'event' | 'buy' | 'penalty' | 'error';
}

// -----------------------------------------------------------
// Full Game State
// -----------------------------------------------------------
export interface GameState {
  // Match metadata
  shift: number;         // total shifts played (1-indexed)
  period: 1 | 2 | 3;
  isOvertimeMode: boolean; // 3-on-3 in overtime

  // Period management
  periods: [PeriodState, PeriodState, PeriodState];

  // Players
  players: [PlayerState, PlayerState];

  // Current phase
  phase: GamePhase;

  // Phase-specific state
  faceoff: FaceoffState | null;
  combat: CombatState | null;

  // Market
  marketSlots: MarketSlot[];
  marketDeck: Card[];  // remaining cards not in market

  // Supply
  penaltySupply: Card[]; // penalty cards available

  // Whose turn it is to buy (shoots-second player goes first)
  buyPhaseActivePlayer: 0 | 1 | null;

  // Log
  log: LogEntry[];

  // UI hint — which player should be looking at screen
  activeScreenPlayer: 0 | 1 | null;

  // Overtime format: only 3 cards deployed (2F + 1D)
  overtimeLineupFormat: boolean;

  // Winner (set when game_over)
  winner: 0 | 1 | 'tie' | null;
}

// -----------------------------------------------------------
// Game Actions (dispatched to reducer)
// -----------------------------------------------------------
export type GameAction =
  // Setup
  | { type: 'START_GAME'; playerNames: [string, string] }
  // Phase 1
  | { type: 'ROLL_FACEOFF'; playerId: 0 | 1; roll: number }
  // Phase 2
  | { type: 'FLIP_EVENT_CARD' }
  | { type: 'RESOLVE_IMMEDIATE_EVENT'; playerId?: 0 | 1; tokenLost?: keyof Tokens; amount?: number }
  | { type: 'CONTINUE_TO_LINEUP' }
  // Phase 3
  | { type: 'PLACE_CARD_IN_LINEUP'; playerId: 0 | 1; cardId: string; position: LineupPosition; faceDown: boolean }
  | { type: 'REMOVE_CARD_FROM_LINEUP'; playerId: 0 | 1; position: LineupPosition }
  | { type: 'SWAP_GOALIE'; playerId: 0 | 1; newGoalieCardId: string }
  | { type: 'CONFIRM_LINEUP'; playerId: 0 | 1 }
  // Phase 4
  | { type: 'REVEAL_LINEUPS' }
  | { type: 'AWARD_LINEUP_ENERGY'; playerId: 0 | 1 }
  // Phase 5
  | { type: 'ROLL_DICE'; playerId: 0 | 1 }
  | { type: 'REROLL_DICE'; playerId: 0 | 1; dieIds: string[] }
  | { type: 'ASSIGN_WILD'; playerId: 0 | 1; dieId: string; assignTo: 'energy' | 'shoot' | 'block' }
  | { type: 'ASSIGN_DIE_TO_ZONE'; playerId: 0 | 1; dieId: string; zone: 'energy' | 'shoot' | 'block' }
  | { type: 'COMMIT_SHOOT_TOKENS'; playerId: 0 | 1; amount: number }
  | { type: 'CONFIRM_ROLL_ASSIGN'; playerId: 0 | 1 }
  // Phase 6
  | { type: 'REVEAL_ROLLS' }
  | { type: 'CONVERT_ENERGY_PIPS'; playerId: 0 | 1 }
  | { type: 'DETERMINE_INITIATIVE' }
  | { type: 'ROLL_INITIATIVE_TIEBREAKER'; rolls: [number, number] }
  // Phase 7
  | { type: 'DECLARE_ATTACK' }   // attacker declares
  | { type: 'COMMIT_BLOCK_TOKENS'; playerId: 0 | 1; amount: number }
  | { type: 'RESOLVE_WAVE'; wave: 1 | 2; attackRolls: number[]; blockRolls: number[] }
  | { type: 'APPLY_PUCK_CONTROL' }
  // Phase 8
  | { type: 'DRAFT_CARD'; playerId: 0 | 1; marketSlotId: string }
  | { type: 'TRADE_CARD'; playerId: 0 | 1; marketSlotId: string; trashCardId: string }
  | { type: 'SCOUT_CARD'; playerId: 0 | 1; marketSlotId: string }
  | { type: 'BUY_TOKEN'; playerId: 0 | 1; tokenType: 'shoot' | 'block' }
  | { type: 'END_BUY_PHASE'; playerId: 0 | 1 }
  // Phase 9
  | { type: 'CLEANUP' }
  | { type: 'NEXT_SHIFT' }
  // Overtime
  | { type: 'ENTER_OVERTIME' }
  // Undo / reset
  | { type: 'RESET_GAME' };

// -----------------------------------------------------------
// Helper: Scoring constants
// -----------------------------------------------------------
export const GOAL_ENERGY_BONUS = 2;
export const SCOUTING_COST = 2;
export const TOKEN_PURCHASE_COST = 5;
export const SHUTOUT_BLOCK_VALUE = 5;

// Trade premium: base cost + 2 (simple rule for the app)
export function tradeCost(card: Card): number {
  return card.cost + 2;
}
